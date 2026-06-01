import { readFileSync } from "node:fs";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { getProgram, type KolibriProgram } from "@kolibri/sdk";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { env } from "../env.js";

let _service: Keypair | null = null;
export function serviceKeypair(): Keypair {
  if (_service) return _service;
  const raw = JSON.parse(readFileSync(env.SERVICE_KEYPAIR_PATH, "utf8")) as number[];
  _service = Keypair.fromSecretKey(Uint8Array.from(raw));
  return _service;
}

let _connection: Connection | null = null;
export function connection(): Connection {
  if (!_connection) _connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
  return _connection;
}

let _program: KolibriProgram | null = null;
export function program(): KolibriProgram {
  if (_program) return _program;
  const wallet = new Wallet(serviceKeypair());
  const provider = new AnchorProvider(connection(), wallet, { commitment: "confirmed" });
  _program = getProgram(provider);
  return _program;
}

/** Transfere SOL da keypair de serviço p/ uma wallet (faucet de onboarding). */
export async function fundWallet(
  recipient: PublicKey,
  lamports: number,
): Promise<{ funded: boolean; signature?: string; balance: number }> {
  const conn = connection();
  const current = await conn.getBalance(recipient);
  // não refunda quem já tem saldo confortável
  if (current >= lamports * 2) {
    return { funded: false, balance: current };
  }
  const service = serviceKeypair();
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: service.publicKey,
      toPubkey: recipient,
      lamports,
    }),
  );
  const signature = await sendAndConfirmTransaction(conn, tx, [service]);
  const balance = await conn.getBalance(recipient);
  return { funded: true, signature, balance };
}
