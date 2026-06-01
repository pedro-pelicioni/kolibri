import { PublicKey } from "@solana/web3.js";
import type { SolanaCluster } from "@kolibri/types";
import { ulidToBytes } from "./ulid.js";

export const DEFAULT_CLUSTER: SolanaCluster = "devnet";

export const RPC_BY_CLUSTER: Record<SolanaCluster, string> = {
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
};

/** Seed do PDA do `Batch` (igual ao do programa Anchor). */
export const BATCH_SEED = "batch";

const enc = new TextEncoder();

/**
 * Deriva o PDA do `Batch`: seeds = ["batch", dispensary, batch_id(16 bytes)].
 * Determinístico — usado pelo API (ancorar), Web (verificar) e passaporte público.
 */
export function deriveBatchPda(
  programId: PublicKey,
  dispensary: PublicKey,
  batchUlid: string,
): [PublicKey, number] {
  const idBytes = ulidToBytes(batchUlid);
  return PublicKey.findProgramAddressSync(
    [enc.encode(BATCH_SEED), dispensary.toBytes(), idBytes],
    programId,
  );
}

export function explorerTxUrl(sig: string, cluster: SolanaCluster = DEFAULT_CLUSTER): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=${cluster}`;
}

export function explorerAddressUrl(
  address: string,
  cluster: SolanaCluster = DEFAULT_CLUSTER,
): string {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}
