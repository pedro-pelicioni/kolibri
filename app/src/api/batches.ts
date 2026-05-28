// Read API pros batches — UI usa pra popular Home (listBatches) e
// PlantPassportScreen (getBatchPassport). Em stub mode devolve `mockBatches`.

import { config } from '../config';
import { api } from './client';
import { mockBatches, mockPassport } from '../mocks/passport.mock';
import type { PlantPassport } from '../types/passport';
import { passportFromGateway } from './mappers';

// Programa devnet do compliance-registry-pinocchio (selector 0x06).
// TODO: mover pra config quando o gateway expuser via /version.
const PROGRAM_ID = 'FZ21S53Rn8Y6ANfccS2waCrkYWh5zfjXK3hkKU5YSkJ8';

interface GatewayBatch {
  id: string;
  cultivar_code: string;
  origin_event_type?: number;
  created_at: string;
  [k: string]: unknown;
}

interface GatewayEvent {
  id?: string;
  event_id?: string;
  event_type?: number;
  tx_signature?: string;
  [k: string]: unknown;
}

export async function listBatches(): Promise<PlantPassport[]> {
  if (config.useStub) return mockBatches;

  // Gateway returns flat list of batches. We hydrate each in parallel with
  // its events. For Home (where ~10 items show), this is fine — paginate later.
  const batches = await api<GatewayBatch[]>('/batches');
  if (!Array.isArray(batches) || batches.length === 0) return [];
  const passports = await Promise.all(
    batches.map(async (b) => {
      try {
        return await getBatchPassport(b.id);
      } catch {
        // Skip rows we can't hydrate; Home renders the rest.
        return null;
      }
    }),
  );
  return passports.filter((p): p is PlantPassport => p !== null);
}

export async function getBatchPassport(batchId: string): Promise<PlantPassport> {
  if (config.useStub) return mockPassport;

  const [batch, events] = await Promise.all([
    api<GatewayBatch>(`/batches/${encodeURIComponent(batchId)}`),
    api<GatewayEvent[]>(`/batches/${encodeURIComponent(batchId)}/events`),
  ]);
  return passportFromGateway({
    batch,
    events: Array.isArray(events) ? events : [],
    cluster: config.cluster,
    programId: PROGRAM_ID,
  });
}

export async function createBatch(input: {
  cultivarCode: string;
  parentBatchId?: string;
  originEventType: number;
}): Promise<{ id: string }> {
  if (config.useStub) {
    return { id: '01' + Math.random().toString(36).slice(2, 26).toUpperCase().padEnd(24, 'X') };
  }
  return api<{ id: string }>('/batches', {
    method: 'POST',
    body: {
      cultivar_code: input.cultivarCode,
      origin_event_type: input.originEventType,
      ...(input.parentBatchId ? { parent_batch_id: input.parentBatchId } : {}),
    },
  });
}

export const _testing = { PROGRAM_ID };
