import { hashCanonical, newUlid } from "@kolibri/sdk";
import { EventType, buildEventPayload } from "@kolibri/types";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../env.js";
import { batchToDTO, eventToDTO } from "../lib/mappers.js";

const CreateBatch = z.object({
  cultivarCode: z.string().min(1).max(16),
  cultivarFull: z.string().optional(),
  genotype: z.string().optional(),
  imageUri: z.string().optional(),
  originEventType: z.number().int().min(1).max(15),
  payload: z.record(z.string(), z.unknown()).default({}),
});

const CreateEvent = z.object({
  eventType: z.number().int().min(1).max(15),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export async function plantRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // lista + métricas do dashboard
  app.get("/plants", auth, async (req) => {
    const did = req.user.did;
    const batches = await app.prisma.batch.findMany({
      where: { dispensaryId: did },
      orderBy: { createdAt: "desc" },
      include: { dispensary: true, _count: { select: { events: true } } },
    });
    const items = batches.map((b) => batchToDTO(b, b._count.events));
    const total = items.length;
    const active = items.filter((i) => i.status === 0).length;
    const recalled = items.filter((i) => i.status === 1).length;
    const anchored = items.filter((i) => i.anchor.anchoredAt).length;
    return {
      items,
      metrics: {
        total,
        active,
        recalled,
        anchoredPct: total ? Math.round((anchored / total) * 100) : 0,
      },
    };
  });

  // registra planta: gera ULID, valida+canonicaliza payload de origem, persiste (pendente)
  app.post("/plants", auth, async (req, reply) => {
    const b = CreateBatch.parse(req.body);
    const did = req.user.did;
    const ulid = newUlid();

    const parsed = buildEventPayload(b.originEventType as EventType, {
      cultivar_full: b.cultivarFull,
      genotype: b.genotype,
      ...b.payload,
    });
    const { canonical, hashHex } = hashCanonical(parsed);
    const storageUri = `${env.PUBLIC_PASSPORT_BASE_URL}/${ulid}`;

    const batch = await app.prisma.batch.create({
      data: {
        id: ulid,
        dispensaryId: did,
        cultivarCode: b.cultivarCode,
        cultivarFull: b.cultivarFull ?? null,
        genotype: b.genotype ?? null,
        originEventType: b.originEventType,
        imageUri: b.imageUri ?? null,
        cluster: env.SOLANA_CLUSTER,
        programId: env.PROGRAM_ID ?? null,
        events: {
          create: {
            eventType: b.originEventType,
            payloadJson: parsed,
            canonicalJson: canonical,
            payloadHash: hashHex,
            storageUri,
            index: 0,
          },
        },
      },
      include: { dispensary: true },
    });

    return reply.code(201).send(batchToDTO(batch, 1));
  });

  // detalhe + timeline
  app.get("/plants/:id", auth, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const did = req.user.did;
    const batch = await app.prisma.batch.findFirst({
      where: { id, dispensaryId: did },
      include: { dispensary: true, events: { orderBy: { index: "asc" } } },
    });
    if (!batch) return reply.code(404).send({ error: "não encontrado" });
    return {
      batch: batchToDTO(batch, batch.events.length),
      events: batch.events.map((e) => eventToDTO(e, true)),
    };
  });

  // registra um evento do ciclo de vida (pendente de ancoragem)
  app.post("/plants/:id/events", auth, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const did = req.user.did;
    const b = CreateEvent.parse(req.body);

    const batch = await app.prisma.batch.findFirst({
      where: { id, dispensaryId: did },
      include: { _count: { select: { events: true } } },
    });
    if (!batch) return reply.code(404).send({ error: "não encontrado" });

    const parsed = buildEventPayload(b.eventType as EventType, b.payload);
    const { canonical, hashHex } = hashCanonical(parsed);
    const storageUri = `${env.PUBLIC_PASSPORT_BASE_URL}/${id}`;

    const event = await app.prisma.event.create({
      data: {
        batchId: id,
        eventType: b.eventType,
        payloadJson: parsed,
        canonicalJson: canonical,
        payloadHash: hashHex,
        storageUri,
        index: batch._count.events,
      },
    });

    // reflete status localmente (o worker também ajusta on-chain)
    if (b.eventType === 14) await app.prisma.batch.update({ where: { id }, data: { status: 1 } });
    if (b.eventType === 15) await app.prisma.batch.update({ where: { id }, data: { status: 2 } });

    return reply.code(201).send(eventToDTO(event, true));
  });
}
