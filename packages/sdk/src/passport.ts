import {
  EventType,
  type BadgeDTO,
  type BatchDTO,
  type EventDTO,
  type GaugeDTO,
  type PassportDTO,
} from "@kolibri/types";

/** Estágios canônicos do ciclo de vida usados pra medir "completude". */
const LIFECYCLE_STAGES: EventType[] = [
  EventType.SEED_PLANTED,
  EventType.MOTHER_REGISTERED,
  EventType.VEGETATION_START,
  EventType.FLOWERING_START,
  EventType.HARVEST,
  EventType.DRYING_START,
  EventType.CURING_START,
  EventType.PACKAGED,
];

export function buildGauges(_batch: BatchDTO, events: EventDTO[]): GaugeDTO[] {
  const types = new Set(events.map((e) => e.eventType));

  const present = LIFECYCLE_STAGES.filter((s) => types.has(s)).length;
  const completeness = Math.round((present / LIFECYCLE_STAGES.length) * 100);

  const hasLab = types.has(EventType.LAB_RESULT_RELEASED);
  const labPass = hasLab ? 100 : 0;

  const anchored = events.filter((e) => e.anchoredAt).length;
  const coverage = events.length ? Math.round((anchored / events.length) * 100) : 0;

  return [
    { key: "lifecycle", label: "Completude do ciclo", value: completeness },
    { key: "lab", label: "Aprovação laboratorial", value: labPass },
    { key: "coverage", label: "Rastreabilidade ancorada", value: coverage },
  ];
}

export function buildBadges(events: EventDTO[]): BadgeDTO[] {
  const types = new Set(events.map((e) => e.eventType));
  return [
    {
      key: "origin",
      label: "Origem registrada",
      active: types.has(EventType.SEED_PLANTED) || types.has(EventType.MOTHER_REGISTERED),
      tone: "quality",
    },
    {
      key: "coa",
      label: "COA laboratorial",
      active: types.has(EventType.LAB_RESULT_RELEASED),
      tone: "lab",
    },
    {
      key: "anvisa",
      label: "Conformidade ANVISA",
      active: types.has(EventType.PACKAGED) && types.has(EventType.LAB_RESULT_RELEASED),
      tone: "anvisa",
    },
    {
      key: "dispensed",
      label: "Dispensação registrada",
      active: types.has(EventType.DISPENSED),
      tone: "iso",
    },
  ];
}

/** Monta o read-model do passaporte a partir do lote + eventos. */
export function buildPassport(batch: BatchDTO, events: EventDTO[]): PassportDTO {
  const ordered = [...events].sort((a, b) => a.index - b.index);
  return {
    batch,
    events: ordered,
    gauges: buildGauges(batch, ordered),
    badges: buildBadges(ordered),
    publishedAt: batch.anchor.anchoredAt,
  };
}
