import { hexToBytes, sendRecordEvent, sendRegisterPlant, sendSetAsset } from "@kolibri/sdk";
import { PublicKey } from "@solana/web3.js";
import type { FastifyInstance } from "fastify";
import { env } from "../env.js";
import { mintPassportNft } from "../lib/nft.js";
import { program, serviceKeypair } from "../lib/solana.js";

/**
 * Worker server-custody: ancora os lotes/eventos pendentes (anchoredAt = null) com a
 * keypair de serviço. Resiliente — falhas (ex.: sem SOL, RPC fora) são logadas e
 * reprocessadas no próximo tick. O mint do NFT é best-effort (PoE não depende dele).
 */
export function startAnchorWorker(app: FastifyInstance): () => void {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await anchorBatches(app);
      await anchorEvents(app);
    } catch (e) {
      app.log.error({ err: e }, "anchor worker: tick falhou");
    } finally {
      running = false;
    }
  };
  const handle = setInterval(tick, 5000);
  void tick();
  return () => clearInterval(handle);
}

async function anchorBatches(app: FastifyInstance) {
  const pending = await app.prisma.batch.findMany({
    where: { anchoredAt: null },
    include: { dispensary: true, events: { orderBy: { index: "asc" }, take: 1 } },
    take: 5,
  });
  if (!pending.length) return;

  const prog = program();
  const service = serviceKeypair();

  for (const b of pending) {
    const origin = b.events[0];
    if (!origin) continue;
    try {
      const { signature, pda } = await sendRegisterPlant(prog, {
        authority: service.publicKey,
        dispensary: new PublicKey(b.dispensary.walletPubkey),
        batchUlid: b.id,
        originEventType: b.originEventType,
        originHash: hexToBytes(origin.payloadHash),
        storageUri: origin.storageUri,
      });
      const now = new Date();
      await app.prisma.batch.update({
        where: { id: b.id },
        data: { pda, registerTxSig: signature, anchoredAt: now },
      });
      await app.prisma.event.update({
        where: { id: origin.id },
        data: { solanaPda: pda, solanaTxSig: signature, anchoredAt: now },
      });
      app.log.info({ batch: b.id, signature }, "lote ancorado (register_plant)");

      // mint do NFT Metaplex Core (best-effort)
      try {
        const asset = await mintPassportNft({
          name: `Kolibri • ${b.cultivarFull ?? b.cultivarCode}`,
          uri: `${env.API_PUBLIC_URL}/passport/${b.id}/metadata.json`,
          owner: b.dispensary.walletPubkey,
        });
        await sendSetAsset(prog, {
          authority: service.publicKey,
          dispensary: new PublicKey(b.dispensary.walletPubkey),
          batchUlid: b.id,
          asset: new PublicKey(asset),
        });
        await app.prisma.batch.update({ where: { id: b.id }, data: { asset } });
        app.log.info({ batch: b.id, asset }, "NFT mintado + vinculado (set_asset)");
      } catch (e) {
        app.log.warn({ err: e, batch: b.id }, "mint do NFT falhou (PoE segue intacto)");
      }
    } catch (e) {
      app.log.error({ err: e, batch: b.id }, "register_plant falhou (retry no próximo tick)");
    }
  }
}

async function anchorEvents(app: FastifyInstance) {
  const pending = await app.prisma.event.findMany({
    where: { anchoredAt: null, index: { gt: 0 }, batch: { anchoredAt: { not: null } } },
    include: { batch: { include: { dispensary: true } } },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
  if (!pending.length) return;

  const prog = program();
  const service = serviceKeypair();

  for (const e of pending) {
    try {
      const { signature, pda } = await sendRecordEvent(prog, {
        authority: service.publicKey,
        dispensary: new PublicKey(e.batch.dispensary.walletPubkey),
        batchUlid: e.batchId,
        eventType: e.eventType,
        payloadHash: hexToBytes(e.payloadHash),
        storageUri: e.storageUri,
      });
      await app.prisma.event.update({
        where: { id: e.id },
        data: { solanaPda: pda, solanaTxSig: signature, anchoredAt: new Date() },
      });
      app.log.info({ event: e.id, signature }, "evento ancorado (record_event)");
    } catch (err) {
      app.log.error({ err, event: e.id }, "record_event falhou (retry no próximo tick)");
    }
  }
}
