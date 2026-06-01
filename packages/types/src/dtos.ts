import type { BatchStatus, EventType } from "./event-types.js";

export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta";

/** Referências on-chain de um lote/planta. */
export interface AnchorRef {
  cluster: SolanaCluster;
  programId: string | null;
  /** PDA do `Batch` (base58). */
  pda: string | null;
  /** Assinatura da tx de registro (base58). */
  registerTxSig: string | null;
  /** Endereço do NFT Metaplex Core desta planta (base58). */
  asset: string | null;
  /** Quando o registro foi confirmado on-chain (ISO 8601) ou null se pendente. */
  anchoredAt: string | null;
}

export interface EventDTO {
  id: string;
  batchId: string;
  eventType: EventType;
  eventName: string;
  label: string;
  payloadHash: string;
  storageUri: string;
  index: number;
  createdAt: string;
  solanaPda: string | null;
  solanaTxSig: string | null;
  anchoredAt: string | null;
  /** Payload completo — incluído apenas em leituras autorizadas/detalhe. */
  payload?: Record<string, unknown>;
}

export interface BatchDTO {
  id: string; // ULID (string)
  cultivarCode: string;
  cultivarFull: string | null;
  genotype: string | null;
  originEventType: EventType;
  status: BatchStatus;
  imageUri: string | null;
  dispensaryName: string | null;
  dispensaryWallet: string | null;
  createdAt: string;
  eventCount: number;
  anchor: AnchorRef;
}

/** Medidor circular (0..100) — linha "Sustainability" do passaporte. */
export interface GaugeDTO {
  key: string;
  label: string;
  value: number;
}

export type BadgeTone = "anvisa" | "lab" | "iso" | "quality";

/** Selo de compliance — linha "Compliance Reporting" do passaporte. */
export interface BadgeDTO {
  key: string;
  label: string;
  active: boolean;
  tone: BadgeTone;
}

/** Read-model público do Digital Product Passport (DPP). */
export interface PassportDTO {
  batch: BatchDTO;
  events: EventDTO[];
  gauges: GaugeDTO[];
  badges: BadgeDTO[];
  /** ISO da ancoragem do registro, ou null se ainda pendente. */
  publishedAt: string | null;
}

/** Dados para o browser recomputar sha256 e comparar com o on-chain. */
export interface VerifyDataDTO {
  batchId: string;
  cluster: SolanaCluster;
  programId: string | null;
  pda: string | null;
  events: Array<{
    index: number;
    eventType: EventType;
    canonicalJson: string;
    payloadHash: string;
    txSig: string | null;
  }>;
}

/** Resposta de upload (foto/COA). */
export interface UploadResultDTO {
  storageUri: string;
  sha256Hex: string;
  bytes: number;
  contentType: string;
}
