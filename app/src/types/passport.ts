// Types model the on-chain reality: a batch is a sequence of events anchored
// against Solana via the kolibri-gateway. The "passport" UI is just a denormalized
// read of that history.

export type EventCode =
  | 'SEED_PLANTED'
  | 'MOTHER_REGISTERED'
  | 'CLONE_CUT'
  | 'VEGETATION_START'
  | 'FLOWERING_START'
  | 'HARVEST'
  | 'DRYING_START'
  | 'CURING_START'
  | 'LAB_SAMPLE_TAKEN'
  | 'LAB_RESULT_RELEASED'
  | 'PACKAGED'
  | 'TRANSFERRED'
  | 'DISPENSED'
  | 'RECALLED'
  | 'DESTROYED';

export type TimelineActor = 'cultivator' | 'lab' | 'logistics' | 'dispensary';

export interface TimelineEvent {
  /** Event id (ULID from gateway) */
  id: string;
  /** Friendly summary shown as the stepper title */
  title: string;
  /** Canonical event type from the 15-event taxonomy */
  code: EventCode;
  /** Who authored the event */
  actor: TimelineActor;
  /** Free-text location for the demo — production uses geo-hash */
  location: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Solana tx signature that anchored this event (base58) */
  txSignature: string;
  /** True once we've matched the on-chain PDA back to this event */
  verified: boolean;
}

export interface LabPanel {
  cbdPct: number;       // % w/w
  thcPct: number;       // % w/w (must be < 0.3 to comply with ANVISA)
  totalCannabinoidsPct: number;
  terpenesPct?: number;
  microbiology: 'PASS' | 'FAIL';
  heavyMetals: 'PASS' | 'FAIL';
  residualSolvents: 'PASS' | 'FAIL';
  pesticides: 'PASS' | 'FAIL';
  labName: string;
  labLicense: string;   // ANVISA / state lab license
  coaUrl?: string;      // Shadow Drive URI of the signed COA PDF
  testedAt: string;     // ISO 8601
}

export interface ProofOfExistence {
  network: 'mainnet-beta' | 'devnet' | 'testnet';
  programId: string;         // FZ21S53...
  txSignature: string;       // full sig (base58)
  pda: string;               // PDA of the anchored event
  slot: number;
  blockTime: string;         // ISO 8601 from the cluster
  /** Canonical-JSON SHA-256 of the payload — auditor can recompute */
  payloadSha256: string;
  /** Shadow Drive URI of the immutable payload (server-encrypted) */
  payloadUri: string;
  /** Solscan / Solana Explorer URL — handed to the user as the "open in explorer" link */
  explorerUrl: string;
}

export interface PlantPassport {
  strainName: string;          // e.g. "Cannatonic CBD"
  cultivarCode: string;        // ≤ 8 chars, e.g. "HEM:CBD1"
  batchId: string;             // ULID of the batch
  batchLabel: string;          // human-readable batch label printed on package
  harvestDate: string;         // ISO 8601
  packagedDate: string;        // ISO 8601
  netWeightGrams: number;
  cultivator: {
    name: string;
    cnpj: string;              // Brazilian tax id (cultivator)
    anvisaLicense: string;
    farmLocation: string;
  };
  lab: LabPanel;
  timeline: TimelineEvent[];
  proof: ProofOfExistence;
  /** True if every event in the timeline has matched its on-chain PDA */
  verified: boolean;
}
