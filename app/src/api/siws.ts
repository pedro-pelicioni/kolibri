// Sign-In With Solana — orquestra os 3 passos do login wallet-first:
//
//   1. POST /auth/siws/challenge       (gateway gera nonce + canonical msg)
//   2. wallet.signMessages              (Seed Vault prompt no Seeker)
//   3. POST /auth/siws/verify           (gateway valida + emite JWT)
//
// O signer é injetado (dependency injection) pra que os tests possam usar
// um fake sem precisar do MWA nativo.

import type { UserRole } from '../types/passport';
import { config, type Cluster } from '../config';
import { api, setTokens } from './client';
import { persistSession } from './storage';

export interface AuthorizedWallet {
  publicKey: string;
  walletName: string;
  authToken: string;
}

export interface WalletSigner {
  /** Pede consent ao Seed Vault. Idempotente dentro de uma sessão MWA. */
  authorize(cluster: Cluster): Promise<AuthorizedWallet>;
  /** Assina UTF-8 (base64 retorno). */
  signMessage(pubkey: string, message: string): Promise<string>;
}

export interface SiwsResult {
  accessToken: string;
  refreshToken: string;
  tenantId?: string;
  role?: UserRole;
  agentName?: string;
  pubkey: string;
  walletName: string;
}

interface ChallengeResponse {
  message?: string;
  nonce?: string;
  pubkey?: string;
}

interface VerifyResponse {
  access_token?: string;
  refresh_token?: string;
  tenant_id?: string;
  role?: string;
  agent_name?: string;
  expires_in?: number;
}

/**
 * Executa o fluxo SIWS completo. Lança em qualquer passo que falhar — o
 * caller (SessionContext) é quem decide se mostra erro pro usuário.
 */
export async function loginWithSIWS(
  signer: WalletSigner,
  opts: { cluster?: Cluster; role?: UserRole; agentName?: string } = {},
): Promise<SiwsResult> {
  const cluster = opts.cluster ?? config.cluster;
  const auth = await signer.authorize(cluster);

  const challenge = await api<ChallengeResponse>('/auth/siws/challenge', {
    method: 'POST',
    body: { pubkey: auth.publicKey },
    noAuthRetry: true,
  });
  if (!challenge.message || !challenge.nonce) {
    throw new Error('Gateway returned malformed SIWS challenge');
  }

  const signatureB64 = await signer.signMessage(auth.publicKey, challenge.message);

  const verify = await api<VerifyResponse>('/auth/siws/verify', {
    method: 'POST',
    body: {
      pubkey: auth.publicKey,
      nonce: challenge.nonce,
      signature: signatureB64,
      ...(opts.role ? { role: opts.role } : {}),
      ...(opts.agentName ? { agent_name: opts.agentName } : {}),
    },
    noAuthRetry: true,
  });
  if (!verify.access_token || !verify.refresh_token) {
    throw new Error('Gateway did not issue tokens — verify failed');
  }

  setTokens(verify.access_token, verify.refresh_token);
  const result: SiwsResult = {
    accessToken: verify.access_token,
    refreshToken: verify.refresh_token,
    tenantId: verify.tenant_id,
    role: verify.role as UserRole | undefined,
    agentName: verify.agent_name,
    pubkey: auth.publicKey,
    walletName: auth.walletName,
  };
  await persistSession({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    tenantId: result.tenantId,
    role: result.role,
    agentName: result.agentName,
    pubkey: result.pubkey,
  });
  return result;
}
