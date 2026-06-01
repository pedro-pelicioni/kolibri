import { readFileSync } from "node:fs";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { getProgram, type KolibriProgram } from "@kolibri/sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { env } from "../env.js";

let _service: Keypair | null = null;
export function serviceKeypair(): Keypair {
  if (_service) return _service;
  // Render/cloud: lê de SERVICE_KEYPAIR_JSON (env). Local: do arquivo (SERVICE_KEYPAIR_PATH).
  const raw = (
    env.SERVICE_KEYPAIR_JSON
      ? JSON.parse(env.SERVICE_KEYPAIR_JSON)
      : JSON.parse(readFileSync(env.SERVICE_KEYPAIR_PATH, "utf8"))
  ) as number[];
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
