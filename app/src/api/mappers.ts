// Adaptadores entre as shapes do kolibri-gateway e os tipos UI (PlantPassport).
//
// O gateway retorna batches + eventos achatados ("snake_case"). O app pinta
// PlantPassport (camelCase, embedded lab/proof/timeline). Os mappers fazem a
// ponte numa só direção (read), garantindo que se o gateway adicionar campos
// novos a gente não quebra.

import type {
  EventCode,
  PlantPassport,
  ProofOfExistence,
  TimelineActor,
  TimelineEvent,
} from '../types/passport';

/* eslint-disable @typescript-eslint/no-explicit-any */

const SOLSCAN = (cluster: ProofOfExistence['network'], sig: string) =>
  `https://solscan.io/tx/${sig}?cluster=${cluster}`;

/** event_type (1..15) → EventCode enum string. */
const EVENT_CODE_BY_NUMBER: Record<number, EventCode> = {
  1: 'SEED_PLANTED',
  2: 'MOTHER_REGISTERED',
  3: 'CLONE_CUT',
  4: 'VEGETATION_START',
  5: 'FLOWERING_START',
  6: 'HARVEST',
  7: 'DRYING_START',
  8: 'CURING_START',
  9: 'LAB_SAMPLE_TAKEN',
  10: 'LAB_RESULT_RELEASED',
  11: 'PACKAGED',
  12: 'TRANSFERRED',
  13: 'DISPENSED',
  14: 'RECALLED',
  15: 'DESTROYED',
};

export function eventCodeOf(typeNum: number | string | undefined): EventCode {
  if (typeof typeNum === 'string') {
    return (typeNum as EventCode) ?? 'SEED_PLANTED';
  }
  return EVENT_CODE_BY_NUMBER[typeNum ?? 1] ?? 'SEED_PLANTED';
}

const ACTOR_BY_ROLE: Record<string, TimelineActor> = {
  cultivator: 'cultivator',
  lab: 'lab',
  dispensary: 'dispensary',
  // map any logistics-ish role onto 'logistics'
  logistics: 'logistics',
  carrier: 'logistics',
};

export function actorOf(role: string | undefined): TimelineActor {
  return (role && ACTOR_BY_ROLE[role]) || 'cultivator';
}

/**
 * Gateway shape (heurístico) → TimelineEvent
 * Campos esperados: id|event_id, event_type, actor_role, location, occurred_at|ts,
 * tx_signature, anchored (bool).
 */
export function timelineFromGateway(raw: any[]): TimelineEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((e) => ({
    id: String(e.id ?? e.event_id ?? ''),
    title: humanTitleOf(e),
    code: eventCodeOf(e.event_type ?? e.eventType ?? e.code),
    actor: actorOf(e.actor_role ?? e.role ?? e.actor),
    location: String(e.location ?? e.location_text ?? '—'),
    timestamp: isoOf(e.occurred_at ?? e.ts ?? e.timestamp ?? e.created_at),
    txSignature: String(e.tx_signature ?? e.signature ?? ''),
    verified: Boolean(e.anchored ?? e.verified ?? false),
  }));
}

function humanTitleOf(e: any): string {
  if (e.title) return String(e.title);
  const code = eventCodeOf(e.event_type ?? e.eventType ?? e.code);
  return TITLE_BY_CODE[code] ?? code;
}

const TITLE_BY_CODE: Record<EventCode, string> = {
  SEED_PLANTED: 'Seed Planted',
  MOTHER_REGISTERED: 'Mother Registered',
  CLONE_CUT: 'Clone Cut',
  VEGETATION_START: 'Vegetation Started',
  FLOWERING_START: 'Flowering Started',
  HARVEST: 'Harvest',
  DRYING_START: 'Drying Started',
  CURING_START: 'Curing Started',
  LAB_SAMPLE_TAKEN: 'Lab Sample Taken',
  LAB_RESULT_RELEASED: 'Lab Result Released',
  PACKAGED: 'Packaged',
  TRANSFERRED: 'Transferred',
  DISPENSED: 'Dispensed',
  RECALLED: 'Recalled',
  DESTROYED: 'Destroyed',
};

function isoOf(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v).toISOString();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * Compõe um PlantPassport a partir do `GET /batches/{id}` + `GET /batches/{id}/events`.
 *
 * Como o gateway atual não expõe o painel laboratorial em campo dedicado,
 * pegamos os dados do último evento `LAB_RESULT_RELEASED` quando presente, ou
 * usamos placeholders neutros. UI já tem fallback (badge "pendente") pra esse
 * caso — vide CreateCertificateScreen.
 */
export function passportFromGateway(args: {
  batch: any;
  events: any[];
  cluster: ProofOfExistence['network'];
  programId: string;
}): PlantPassport {
  const { batch, events, cluster, programId } = args;
  const timeline = timelineFromGateway(events);

  const lastTx = timeline[timeline.length - 1]?.txSignature ?? '';
  const lab = events.find((e) => eventCodeOf(e.event_type ?? e.code) === 'LAB_RESULT_RELEASED');
  const anchored = events.find((e) => e.tx_signature || e.signature);

  return {
    strainName: String(batch.strain_name ?? batch.strainName ?? batch.cultivar_code ?? '—'),
    cultivarCode: String(batch.cultivar_code ?? batch.cultivarCode ?? ''),
    batchId: String(batch.id ?? batch.batch_id ?? batch.batchId ?? ''),
    batchLabel: String(batch.label ?? batch.batch_label ?? batch.batchLabel ?? batch.id ?? ''),
    harvestDate: isoOf(batch.harvest_date ?? batch.harvestDate ?? batch.created_at),
    packagedDate: isoOf(batch.packaged_date ?? batch.packagedDate ?? batch.updated_at),
    netWeightGrams: Number(batch.net_weight_grams ?? batch.netWeightGrams ?? 0),
    photoUri: String(batch.photo_uri ?? batch.photoUri ?? ''),
    createdAt: isoOf(batch.created_at ?? batch.createdAt),
    documents: Array.isArray(batch.documents) ? batch.documents : [],
    cultivator: {
      name: String(batch.cultivator?.name ?? batch.cultivator_name ?? ''),
      cnpj: String(batch.cultivator?.cnpj ?? batch.cultivator_cnpj ?? ''),
      anvisaLicense: String(batch.cultivator?.anvisa_license ?? batch.anvisa_license ?? ''),
      farmLocation: String(batch.cultivator?.farm_location ?? batch.farm_location ?? '—'),
    },
    lab: {
      cbdPct: Number(lab?.payload?.cbd_pct ?? 0),
      thcPct: Number(lab?.payload?.thc_pct ?? 0),
      totalCannabinoidsPct: Number(lab?.payload?.total_cannabinoids_pct ?? 0),
      microbiology: lab?.payload?.microbiology ?? 'PASS',
      heavyMetals: lab?.payload?.heavy_metals ?? 'PASS',
      residualSolvents: lab?.payload?.residual_solvents ?? 'PASS',
      pesticides: lab?.payload?.pesticides ?? 'PASS',
      labName: String(lab?.payload?.lab_name ?? '—'),
      labLicense: String(lab?.payload?.lab_license ?? '—'),
      coaUrl: lab?.payload?.coa_url,
      testedAt: isoOf(lab?.occurred_at ?? batch.created_at),
    },
    timeline,
    proof: {
      network: cluster,
      programId,
      txSignature: lastTx,
      pda: String(anchored?.event_pda ?? anchored?.pda ?? ''),
      slot: Number(anchored?.slot ?? 0),
      blockTime: isoOf(anchored?.block_time ?? anchored?.occurred_at ?? batch.created_at),
      payloadSha256: String(anchored?.payload_hash ?? ''),
      payloadUri: String(anchored?.storage_uri ?? ''),
      explorerUrl: lastTx ? SOLSCAN(cluster, lastTx) : '',
    },
    verified: timeline.every((t) => t.verified),
  };
}
