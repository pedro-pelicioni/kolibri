import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import type { KolibriRegistry } from "./idl/kolibri_registry.js";
import idlJson from "./idl/kolibri_registry.json";
import { deriveBatchPda } from "./solana.js";
import { ulidToBytes } from "./ulid.js";

// O IDL JSON usa nomes snake_case; o tipo gerado é camelCase. O runtime do Anchor
// converte; o cast é só pra DX tipada.
const idl = idlJson as unknown as KolibriRegistry;

export const KOLIBRI_PROGRAM_ID = new PublicKey(idl.address);

export type KolibriProgram = Program<KolibriRegistry>;

/** Programa com provider que assina (API server-custody). O caller monta o provider. */
export function getProgram(provider: AnchorProvider): KolibriProgram {
  return new Program(idl, provider);
}

/** Programa só-leitura (web): wallet dummy, não assina nada. */
export function getReadonlyProgram(connection: Connection): KolibriProgram {
  const dummy = {
    publicKey: Keypair.generate().publicKey,
    signTransaction: async <T>(tx: T): Promise<T> => tx,
    signAllTransactions: async <T>(txs: T[]): Promise<T[]> => txs,
  };
  const provider = new AnchorProvider(connection, dummy as never, {
    commitment: "confirmed",
  });
  return new Program(idl, provider);
}

export interface BatchAccount {
  authority: PublicKey;
  dispensary: PublicKey;
  batchId: number[];
  originEventType: number;
  originHash: number[];
  eventCount: BN;
  lastEventHash: number[];
  status: number;
  asset: PublicKey;
  createdAt: BN;
  bump: number;
}

export async function fetchBatch(
  program: KolibriProgram,
  batchPda: PublicKey,
): Promise<BatchAccount | null> {
  try {
    return (await program.account.batch.fetch(batchPda)) as unknown as BatchAccount;
  } catch {
    return null;
  }
}

export interface RegisterPlantParams {
  /** = pubkey do provider wallet (keypair de serviço). */
  authority: PublicKey;
  dispensary: PublicKey;
  batchUlid: string;
  originEventType: number;
  originHash: Uint8Array;
  storageUri: string;
}

export async function sendRegisterPlant(
  program: KolibriProgram,
  p: RegisterPlantParams,
): Promise<{ signature: string; pda: string }> {
  const [pda] = deriveBatchPda(program.programId, p.dispensary, p.batchUlid);
  const batchId = Array.from(ulidToBytes(p.batchUlid));
  const signature = await program.methods
    .registerPlant(batchId, p.dispensary, p.originEventType, Array.from(p.originHash), p.storageUri)
    .accountsPartial({
      batch: pda,
      authority: p.authority,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  return { signature, pda: pda.toBase58() };
}

export interface RecordEventParams {
  authority: PublicKey;
  dispensary: PublicKey;
  batchUlid: string;
  eventType: number;
  payloadHash: Uint8Array;
  storageUri: string;
}

export async function sendRecordEvent(
  program: KolibriProgram,
  p: RecordEventParams,
): Promise<{ signature: string; pda: string }> {
  const [pda] = deriveBatchPda(program.programId, p.dispensary, p.batchUlid);
  const signature = await program.methods
    .recordEvent(p.eventType, Array.from(p.payloadHash), p.storageUri)
    .accountsPartial({ batch: pda, authority: p.authority })
    .rpc();
  return { signature, pda: pda.toBase58() };
}

export async function sendSetAsset(
  program: KolibriProgram,
  p: { authority: PublicKey; dispensary: PublicKey; batchUlid: string; asset: PublicKey },
): Promise<string> {
  const [pda] = deriveBatchPda(program.programId, p.dispensary, p.batchUlid);
  return program.methods
    .setAsset(p.asset)
    .accountsPartial({ batch: pda, authority: p.authority })
    .rpc();
}
