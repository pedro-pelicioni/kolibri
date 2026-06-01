import {
  EventType,
  eventLabel,
  eventName,
  type BatchDTO,
  type EventDTO,
  type SolanaCluster,
} from "@kolibri/types";
import type { Batch, Dispensary, Event } from "@prisma/client";

export function eventToDTO(e: Event, includePayload = false): EventDTO {
  const base: EventDTO = {
    id: e.id,
    batchId: e.batchId,
    eventType: e.eventType,
    eventName: eventName(e.eventType as EventType),
    label: eventLabel(e.eventType as EventType),
    payloadHash: e.payloadHash,
    storageUri: e.storageUri,
    index: e.index,
    createdAt: e.createdAt.toISOString(),
    solanaPda: e.solanaPda,
    solanaTxSig: e.solanaTxSig,
    anchoredAt: e.anchoredAt ? e.anchoredAt.toISOString() : null,
  };
  if (includePayload) base.payload = e.payloadJson as Record<string, unknown>;
  return base;
}

export function batchToDTO(
  b: Batch & { dispensary?: Dispensary | null },
  eventCount: number,
): BatchDTO {
  return {
    id: b.id,
    cultivarCode: b.cultivarCode,
    cultivarFull: b.cultivarFull,
    genotype: b.genotype,
    originEventType: b.originEventType as EventType,
    status: b.status,
    imageUri: b.imageUri,
    dispensaryName: b.dispensary?.name ?? null,
    dispensaryWallet: b.dispensary?.walletPubkey ?? null,
    createdAt: b.createdAt.toISOString(),
    eventCount,
    anchor: {
      cluster: b.cluster as SolanaCluster,
      programId: b.programId,
      pda: b.pda,
      registerTxSig: b.registerTxSig,
      asset: b.asset,
      anchoredAt: b.anchoredAt ? b.anchoredAt.toISOString() : null,
    },
  };
}
