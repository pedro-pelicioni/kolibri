// Event lookups — usado pelo ScannerScreen (QR → PDA → passport).

import { config } from '../config';
import { api } from './client';
import { mockPassport } from '../mocks/passport.mock';
import type { PlantPassport } from '../types/passport';
import { getBatchPassport } from './batches';

interface GatewayEvent {
  id?: string;
  batch_id?: string;
  event_pda?: string;
  pda?: string;
  tx_signature?: string;
  payload_hash?: string;
  [k: string]: unknown;
}

/**
 * Dado um PDA on-chain, devolve o passport completo do batch a que pertence.
 * Useful pelo Scanner: app QR-decodifica uma URL `verify/<batchId>` OU um
 * `pda:<pda>` direto.
 */
export async function getPassportByPda(pda: string): Promise<PlantPassport> {
  if (config.useStub) return mockPassport;

  const evt = await api<GatewayEvent>(`/events/by-pda/${encodeURIComponent(pda)}`);
  if (!evt.batch_id) {
    throw new Error(`Event ${pda} has no batch_id — cannot hydrate passport`);
  }
  return getBatchPassport(evt.batch_id);
}

/**
 * Heurística pra decodificar o conteúdo de um QR Code:
 *   - URL `https://dpo2u.com/kolibri/verify/<batchId>` → batch
 *   - prefixo `pda:` → lookup por PDA
 *   - resto: assume batchId puro
 */
export async function resolveQrPayload(raw: string): Promise<PlantPassport> {
  const trimmed = raw.trim();
  if (trimmed.startsWith('pda:')) {
    return getPassportByPda(trimmed.slice(4));
  }
  const verifyMatch = trimmed.match(/\/verify\/([A-Za-z0-9]+)/);
  if (verifyMatch) {
    return getBatchPassport(verifyMatch[1]);
  }
  // Fallback — try as batchId
  return getBatchPassport(trimmed);
}
