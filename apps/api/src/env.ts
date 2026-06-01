import "dotenv/config";
import { homedir } from "node:os";
import path from "node:path";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET precisa de >=32 chars"),
  APP_DOMAIN: z.string().default("localhost:5173"),
  SOLANA_CLUSTER: z.enum(["devnet", "testnet", "mainnet-beta"]).default("devnet"),
  SOLANA_RPC_URL: z.string().default("https://api.devnet.solana.com"),
  PROGRAM_ID: z.string().optional(),
  SERVICE_KEYPAIR_PATH: z.string().default(".keys/service-keypair.json"),
  PUBLIC_PASSPORT_BASE_URL: z.string().default("http://localhost:5173/passport"),
  API_PUBLIC_URL: z.string().default("http://localhost:8080"),
  UPLOAD_DIR: z.string().default("uploads"),
  // quanto o /faucet transfere da keypair de serviço p/ a wallet conectada (default 0,1 SOL)
  FAUCET_LAMPORTS: z.coerce.number().default(100_000_000),
});

const parsed = schema.parse(process.env);

function expandHome(p: string): string {
  return p.startsWith("~") ? path.join(homedir(), p.slice(1)) : p;
}

export const env = {
  ...parsed,
  SERVICE_KEYPAIR_PATH: expandHome(parsed.SERVICE_KEYPAIR_PATH),
};

export type AppEnv = typeof env;
