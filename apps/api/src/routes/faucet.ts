import { PublicKey } from "@solana/web3.js";
import type { FastifyInstance } from "fastify";
import { env } from "../env.js";
import { fundWallet } from "../lib/solana.js";

export async function faucetRoutes(app: FastifyInstance) {
  // Envia SOL da keypair de serviço p/ a wallet do dispensário logado (devnet/local).
  app.post("/faucet", { preHandler: [app.authenticate] }, async (req, reply) => {
    const wallet = req.user.sub;
    try {
      const result = await fundWallet(new PublicKey(wallet), env.FAUCET_LAMPORTS);
      return { ...result, lamports: env.FAUCET_LAMPORTS, wallet };
    } catch (e) {
      req.log.error(e);
      return reply.code(502).send({
        error: "faucet falhou",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  });
}
