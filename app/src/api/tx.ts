// Build → MWA sign → submit pra eventos cannabis-event.
//
// Match exato com o 3-pass do MOBILE.md:
//   1. POST /tx/build/cannabis-event   → gateway monta tx unsigned
//   2. Seed Vault (MWA) assina         → bytes base64
//   3. POST /tx/submit                  → gateway broadcasta + persiste
//
// O signer (`TransactionSigner`) é injetável pra testes.

import { api } from './client';
import { config } from '../config';

export interface CannabisEventInput {
  /** ULID 26-char do batch existente. Pra novos batches, deixar vazio e usar createBatch primeiro. */
  batchId: string;
  /** 1..15 — vide event-schemas.md. */
  eventType: number;
  /** Até 8 chars, e.g. "HEM:CBD1". */
  cultivarCode: string;
  /** Identidade do agente no agent-registry on-chain (ex.: "cultivator:42318911000104"). */
  agentName: string;
  /** Conteúdo arbitrário do evento — gateway canonicaliza e hash. */
  payload: Record<string, unknown>;
  /** Opcional — batch pai pra eventos derivativos (CLONE_CUT, etc.) */
  parentBatchId?: string;
}

interface BuildResponse {
  event_id?: string;
  tx_bytes_b64?: string;
  payload_hash?: string;
  storage_uri?: string;
  event_pda?: string;
}

interface SubmitResponse {
  pda?: string;
  signature?: string;
  slot?: number;
  explorer_url?: string;
}

export interface TransactionSigner {
  /** Assina um tx serializado (base64) e devolve o tx assinado (base64). */
  signTransaction(unsignedTxBase64: string): Promise<string>;
}

export interface AnchorResult {
  eventId: string;
  eventPda: string;
  signature: string;
  explorerUrl: string;
  payloadHash: string;
  storageUri: string;
}

/**
 * Executa os 3 passos. Erro em qualquer um interrompe (gateway nunca tem
 * o tx assinado sem submit — sem estado órfão).
 */
export async function anchorCannabisEvent(
  signer: TransactionSigner,
  input: CannabisEventInput,
): Promise<AnchorResult> {
  if (config.useStub) {
    // Toca o signer pra exercitar o prompt UX (vira no-op em stub).
    await signer.signTransaction('STUB_UNSIGNED');
    const stubSig =
      '5xR2YpKsHaQ9LbVcZmJ7nT3fW4dE1uG6jBoPiNvMqApRzXcKtUwYlSeFhDgRmJ9LnPpTuQwXyAaCbDcEfGh9pL';
    return {
      eventId: 'stub-evt-' + Date.now(),
      eventPda: 'StubPDA' + Math.random().toString(36).slice(2, 18),
      signature: stubSig,
      explorerUrl: `https://solscan.io/tx/${stubSig}?cluster=${config.cluster}`,
      payloadHash: 'stub-' + Math.random().toString(36).slice(2, 18),
      storageUri: `shdw://kolibri/stub/${Date.now()}.json`,
    };
  }

  const built = await api<BuildResponse>('/tx/build/cannabis-event', {
    method: 'POST',
    body: {
      batch_id: input.batchId,
      event_type: input.eventType,
      cultivar_code: input.cultivarCode,
      agent_name: input.agentName,
      payload: input.payload,
      ...(input.parentBatchId ? { parent_batch_id: input.parentBatchId } : {}),
    },
  });
  if (!built.event_id || !built.tx_bytes_b64) {
    throw new Error('Gateway did not return a buildable tx');
  }

  const signedB64 = await signer.signTransaction(built.tx_bytes_b64);

  const submitted = await api<SubmitResponse>('/tx/submit', {
    method: 'POST',
    body: {
      event_id: built.event_id,
      signed_tx_b64: signedB64,
    },
  });
  if (!submitted.signature) {
    throw new Error('Submit succeeded with no signature — refusing to claim anchored');
  }

  return {
    eventId: built.event_id,
    eventPda: submitted.pda ?? built.event_pda ?? '',
    signature: submitted.signature,
    explorerUrl: submitted.explorer_url ?? '',
    payloadHash: built.payload_hash ?? '',
    storageUri: built.storage_uri ?? '',
  };
}
