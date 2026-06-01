/**
 * Os 15 tipos de evento do ciclo de vida da planta (seed-to-sale).
 * Códigos numéricos estáveis — usados off-chain (DB), on-chain (u8) e no canonical JSON.
 * Espelha docs/event-schemas.md.
 */
export enum EventType {
  SEED_PLANTED = 1,
  MOTHER_REGISTERED = 2,
  CLONE_CUT = 3,
  VEGETATION_START = 4,
  FLOWERING_START = 5,
  HARVEST = 6,
  DRYING_START = 7,
  CURING_START = 8,
  LAB_SAMPLE_TAKEN = 9,
  LAB_RESULT_RELEASED = 10,
  PACKAGED = 11,
  TRANSFERRED = 12,
  DISPENSED = 13,
  RECALLED = 14,
  DESTROYED = 15,
}

/** String canônica do campo `evt` no payload (igual ao nome do enum). */
export type EventName = keyof typeof EventType;

export type EventCategory =
  | "origin"
  | "cultivation"
  | "harvest"
  | "lab"
  | "distribution"
  | "dispensary"
  | "compliance";

export type EventRole = "cultivator" | "lab" | "dispensary" | "admin";

export interface EventTypeMeta {
  code: EventType;
  evt: EventName;
  /** Rótulo em PT-BR para a UI. */
  label: string;
  category: EventCategory;
  /** Papéis que tipicamente disparam o evento (informativo; no MVP o dispensário registra tudo). */
  roles: EventRole[];
}

export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  [EventType.SEED_PLANTED]: {
    code: EventType.SEED_PLANTED,
    evt: "SEED_PLANTED",
    label: "Semente plantada",
    category: "origin",
    roles: ["cultivator"],
  },
  [EventType.MOTHER_REGISTERED]: {
    code: EventType.MOTHER_REGISTERED,
    evt: "MOTHER_REGISTERED",
    label: "Planta-mãe registrada",
    category: "origin",
    roles: ["cultivator"],
  },
  [EventType.CLONE_CUT]: {
    code: EventType.CLONE_CUT,
    evt: "CLONE_CUT",
    label: "Clones cortados",
    category: "cultivation",
    roles: ["cultivator"],
  },
  [EventType.VEGETATION_START]: {
    code: EventType.VEGETATION_START,
    evt: "VEGETATION_START",
    label: "Início da vegetação",
    category: "cultivation",
    roles: ["cultivator"],
  },
  [EventType.FLOWERING_START]: {
    code: EventType.FLOWERING_START,
    evt: "FLOWERING_START",
    label: "Início da floração",
    category: "cultivation",
    roles: ["cultivator"],
  },
  [EventType.HARVEST]: {
    code: EventType.HARVEST,
    evt: "HARVEST",
    label: "Colheita",
    category: "harvest",
    roles: ["cultivator"],
  },
  [EventType.DRYING_START]: {
    code: EventType.DRYING_START,
    evt: "DRYING_START",
    label: "Início da secagem",
    category: "harvest",
    roles: ["cultivator"],
  },
  [EventType.CURING_START]: {
    code: EventType.CURING_START,
    evt: "CURING_START",
    label: "Início da cura",
    category: "harvest",
    roles: ["cultivator"],
  },
  [EventType.LAB_SAMPLE_TAKEN]: {
    code: EventType.LAB_SAMPLE_TAKEN,
    evt: "LAB_SAMPLE_TAKEN",
    label: "Amostra enviada ao laboratório",
    category: "lab",
    roles: ["cultivator", "lab"],
  },
  [EventType.LAB_RESULT_RELEASED]: {
    code: EventType.LAB_RESULT_RELEASED,
    evt: "LAB_RESULT_RELEASED",
    label: "Resultado do laboratório (COA)",
    category: "lab",
    roles: ["lab"],
  },
  [EventType.PACKAGED]: {
    code: EventType.PACKAGED,
    evt: "PACKAGED",
    label: "Embalado",
    category: "distribution",
    roles: ["cultivator"],
  },
  [EventType.TRANSFERRED]: {
    code: EventType.TRANSFERRED,
    evt: "TRANSFERRED",
    label: "Transferido ao dispensário",
    category: "distribution",
    roles: ["cultivator", "dispensary"],
  },
  [EventType.DISPENSED]: {
    code: EventType.DISPENSED,
    evt: "DISPENSED",
    label: "Dispensado ao paciente",
    category: "dispensary",
    roles: ["dispensary"],
  },
  [EventType.RECALLED]: {
    code: EventType.RECALLED,
    evt: "RECALLED",
    label: "Recall",
    category: "compliance",
    roles: ["cultivator", "dispensary", "admin"],
  },
  [EventType.DESTROYED]: {
    code: EventType.DESTROYED,
    evt: "DESTROYED",
    label: "Descartado",
    category: "compliance",
    roles: ["cultivator", "admin"],
  },
};

export const ALL_EVENT_TYPES: EventType[] = Object.values(EventType).filter(
  (v): v is EventType => typeof v === "number",
);

export function eventName(code: EventType): EventName {
  return EVENT_TYPE_META[code].evt;
}

export function eventLabel(code: EventType): string {
  return EVENT_TYPE_META[code]?.label ?? `Evento ${code}`;
}

/** Status do lote (espelha o u8 `status` on-chain). */
export enum BatchStatus {
  ACTIVE = 0,
  RECALLED = 1,
  DESTROYED = 2,
}
