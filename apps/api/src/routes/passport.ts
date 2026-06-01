import { buildPassport } from "@kolibri/sdk";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../env.js";
import { batchToDTO, eventToDTO } from "../lib/mappers.js";

export async function passportRoutes(app: FastifyInstance) {
  const webOrigin = env.PUBLIC_PASSPORT_BASE_URL.replace(/\/passport\/?$/, "");

  // read-model público do DPP
  app.get("/passport/:id", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const batch = await app.prisma.batch.findUnique({
      where: { id },
      include: { dispensary: true, events: { orderBy: { index: "asc" } } },
    });
    if (!batch) return reply.code(404).send({ error: "não encontrado" });
    const batchDTO = batchToDTO(batch, batch.events.length);
    const events = batch.events.map((e) => eventToDTO(e, true));
    return buildPassport(batchDTO, events);
  });

  // dados pro browser recomputar sha256 e comparar com o on-chain
  app.get("/passport/:id/verify-data", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const batch = await app.prisma.batch.findUnique({
      where: { id },
      include: { events: { orderBy: { index: "asc" } } },
    });
    if (!batch) return reply.code(404).send({ error: "não encontrado" });
    return {
      batchId: id,
      cluster: batch.cluster,
      programId: batch.programId,
      pda: batch.pda,
      events: batch.events.map((e) => ({
        index: e.index,
        eventType: e.eventType,
        canonicalJson: e.canonicalJson,
        payloadHash: e.payloadHash,
        txSig: e.solanaTxSig,
      })),
    };
  });

  // metadata JSON do NFT Metaplex Core (aponta pro passaporte)
  app.get("/passport/:id/metadata.json", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const batch = await app.prisma.batch.findUnique({ where: { id } });
    if (!batch) return reply.code(404).send({ error: "não encontrado" });
    const statusLabel = ["Ativo", "Recall", "Descartado"][batch.status] ?? "Ativo";
    return {
      name: `Kolibri • ${batch.cultivarFull ?? batch.cultivarCode}`,
      description:
        "Passaporte de rastreabilidade da planta — Proof-of-Existence na Solana (Kolibri).",
      image: batch.imageUri ?? `${webOrigin}/be-the-change.svg`,
      external_url: `${env.PUBLIC_PASSPORT_BASE_URL}/${id}`,
      attributes: [
        { trait_type: "Cultivar", value: batch.cultivarFull ?? batch.cultivarCode },
        { trait_type: "Status", value: statusLabel },
        { trait_type: "Cluster", value: batch.cluster },
      ],
    };
  });
}
