// =====================================================================
// Solana Mobile Wallet Adapter (MWA) — Seeker integration
// =====================================================================
//
// No Solana Seeker, signing passa pelo Seed Vault via Mobile Wallet Adapter.
// A private key nunca sai do secure element e a confirmação biométrica é
// imposta pelo OS.
//
// O toggle real/stub está em `src/config.ts`. Quando `config.useStub=true`
// todas as funções abaixo curto-circuitam pra mocks deterministicos — perfeito
// pra demo e pra rodar jest sem o módulo nativo.
//
// Polyfills (`react-native-get-random-values`, `Buffer`) ligados em index.js
// — necessários por `@solana/web3.js` antes de qualquer tipo desta lib ser
// tocado.
// =====================================================================

import { transact, type Web3MobileWallet } from
  '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

import { config, type Cluster } from '../config';
import type { WalletSigner, AuthorizedWallet } from '../api/siws';
import type { TransactionSigner } from '../api/tx';

export type { Cluster };

/** @deprecated — leia `config.useStub` direto pra clareza. */
export const USE_STUB = config.useStub;

export interface WalletSession {
  /** Base58 public key — identidade SIWS e authority on-chain */
  publicKey: string;
  /** Label resolvido via agent-registry (cultivador/dispensário/lab/auditor) */
  label?: string;
  /** Nome do provider exposto pelo MWA (e.g. "Seed Vault") */
  walletName: string;
  /** Cluster autorizado */
  cluster: Cluster;
  /** Auth token devolvido por `wallet.authorize` — reusar pra silent reconnect */
  authToken: string;
}

const STUB_SESSION: WalletSession = {
  publicKey: '8h4nE9dG2pQuYxJrTfX1aZ7kVbW3sLcPmDnQyB5RhKv6',
  walletName: 'Seed Vault (Seeker)',
  label: 'cultivator:42318911000104',
  cluster: 'devnet',
  authToken: 'mwa-stub-auth-token',
};

const STUB_SIGNATURE_BASE64 = 'BASE64STUB_SIGNATURE_NOT_VALID_ED25519==';
const STUB_TX_BASE64 =
  '5xR2YpKsHaQ9LbVcZmJ7nT3fW4dE1uG6jBoPiNvMqApRzXcKtUwYlSeFhDgRmJ9LnPpTuQwXyAaCbDcEfGh9pL';

/**
 * Conecta na wallet do usuário (Seed Vault no Seeker).
 * Produção: `transact(...)` abre o companion app via Android intent.
 */
export async function connectWallet(
  cluster: Cluster = config.cluster,
): Promise<WalletSession> {
  if (config.useStub) return { ...STUB_SESSION, cluster };

  return transact(async (wallet: Web3MobileWallet) => {
    const auth = await wallet.authorize({
      cluster,
      identity: config.appIdentity,
    });
    const acct = auth.accounts[0];
    return {
      publicKey: new PublicKey(acct.address).toBase58(),
      walletName: auth.wallet_uri_base ?? 'MWA Wallet',
      label: acct.label,
      cluster,
      authToken: auth.auth_token,
    };
  });
}

/**
 * Assina UTF-8 via MWA (usado pelo challenge SIWS).
 * Retorna a signature base64.
 */
export async function signMessageWithWallet(
  session: Pick<WalletSession, 'publicKey'>,
  message: string,
): Promise<string> {
  if (config.useStub) return STUB_SIGNATURE_BASE64;

  const signed = await transact(async (wallet: Web3MobileWallet) => {
    const out = await wallet.signMessages({
      addresses: [session.publicKey],
      payloads: [Buffer.from(message, 'utf8')],
    });
    return out[0];
  });
  return Buffer.from(signed).toString('base64');
}

/**
 * Assina + submete um `cannabis-event` tx preparado pelo gateway.
 * Documentado em docs/MOBILE.md (3-pass flow).
 */
export async function signAndSubmitEvent(
  _session: Pick<WalletSession, 'publicKey'>,
  unsignedTxBase64: string,
): Promise<string> {
  if (config.useStub) return STUB_TX_BASE64;

  const tx = Transaction.from(Buffer.from(unsignedTxBase64, 'base64'));
  const signed = await transact(async (wallet: Web3MobileWallet) => {
    const result = await wallet.signTransactions({ transactions: [tx] });
    return result[0];
  });
  return Buffer.from(signed.serialize()).toString('base64');
}

/**
 * Factory injetável que implementa os contratos esperados pelo api/siws.ts
 * (WalletSigner) e api/tx.ts (TransactionSigner). Mantém uma referência pra
 * última sessão autorizada — necessário pra signTransaction saber qual pubkey
 * usar.
 *
 * Em testes, NÃO use isto; injete um fake direto (vide
 * src/api/__tests__/siws.test.ts).
 */
export function getWalletSigner(): WalletSigner & TransactionSigner {
  let session: WalletSession | null = null;

  return {
    async authorize(cluster: Cluster): Promise<AuthorizedWallet> {
      session = await connectWallet(cluster);
      return {
        publicKey: session.publicKey,
        walletName: session.walletName,
        authToken: session.authToken,
      };
    },
    async signMessage(pubkey: string, message: string): Promise<string> {
      return signMessageWithWallet({ publicKey: pubkey }, message);
    },
    async signTransaction(unsignedTxBase64: string): Promise<string> {
      const pk = session?.publicKey ?? STUB_SESSION.publicKey;
      return signAndSubmitEvent({ publicKey: pk }, unsignedTxBase64);
    },
  };
}

/** Helper visual — encurta uma sig base58 pro formato "5xR2…9pL". */
export function truncateSignature(sig: string, head = 5, tail = 4): string {
  if (sig.length <= head + tail + 3) return sig;
  return `${sig.slice(0, head)}…${sig.slice(-tail)}`;
}

export const _internal = { APP_IDENTITY: config.appIdentity };
export type { Web3MobileWallet };
