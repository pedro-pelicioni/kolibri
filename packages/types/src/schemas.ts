import { z } from "zod";
import { EventType, eventName } from "./event-types.js";

/**
 * Schemas zod por tipo de evento (espelham docs/event-schemas.md).
 *
 * REGRA DE PRIVACIDADE: nenhum schema aceita CPF/CNS/nome/endereço/condição clínica.
 * Dados pessoais entram SOMENTE como hash (ex.: `patient_hash`). O zod, por padrão,
 * REMOVE chaves desconhecidas no parse — então o objeto canonicalizado nunca carrega
 * PII vazado pela UI. Sempre canonicalize o RESULTADO do parse, não o input cru.
 */

const schemaV = z.literal(1);
const ts = z.number().int().nonnegative();
const opHash = z.string().min(4).optional();
const photos = z.array(z.string()).optional();
const orgRef = z.object({ cnpj: z.string(), name: z.string().optional() });
const location = z
  .object({
    facility_id: z.string(),
    room: z.string().optional(),
    tray: z.string().optional(),
  })
  .partial();
const passFail = z.enum(["pass", "fail"]);

const base = z.object({ schema_v: schemaV, ts, op_hash: opHash });

export const SeedPlantedSchema = base.extend({
  evt: z.literal("SEED_PLANTED"),
  supplier: orgRef.optional(),
  seed_lot_id: z.string(),
  qty: z.number().int().positive(),
  location: location.optional(),
  germination_method: z.string().optional(),
  photos,
});

export const MotherRegisteredSchema = base.extend({
  evt: z.literal("MOTHER_REGISTERED"),
  cultivar_full: z.string(),
  genotype: z.string().optional(),
  phenotype_notes: z.string().optional(),
  mother_pot_id: z.string().optional(),
  location: location.optional(),
  photos,
  expected_lifespan_days: z.number().int().positive().optional(),
});

export const CloneCutSchema = base.extend({
  evt: z.literal("CLONE_CUT"),
  cut_count: z.number().int().positive(),
  cutting_method: z.string().optional(),
  rooting_hormone: z.string().optional(),
  expected_root_days: z.number().int().positive().optional(),
  destination_tray: z.string().optional(),
});

export const VegetationStartSchema = base.extend({
  evt: z.literal("VEGETATION_START"),
  light_hours: z.number().positive(),
  temperature_c_avg: z.number().optional(),
  humidity_pct_avg: z.number().optional(),
  nutrient_recipe_id: z.string().optional(),
  pot_size_l: z.number().positive().optional(),
  co2_ppm_target: z.number().optional(),
});

export const FloweringStartSchema = base.extend({
  evt: z.literal("FLOWERING_START"),
  light_hours: z.number().positive(),
  pinch_method: z.string().optional(),
  expected_harvest_date: z.string().optional(),
  nutrient_recipe_id: z.string().optional(),
  ec_target: z.number().optional(),
  ph_target: z.number().optional(),
});

export const HarvestSchema = base.extend({
  evt: z.literal("HARVEST"),
  harvest_method: z.string().optional(),
  wet_weight_g: z.number().nonnegative(),
  plant_count: z.number().int().positive().optional(),
  trichome_status: z.string().optional(),
  photos,
});

export const DryingStartSchema = base.extend({
  evt: z.literal("DRYING_START"),
  drying_method: z.string().optional(),
  target_humidity_pct: z.number().optional(),
  target_temp_c: z.number().optional(),
  room_id: z.string().optional(),
  expected_days: z.number().int().positive().optional(),
});

export const CuringStartSchema = base.extend({
  evt: z.literal("CURING_START"),
  container: z.string().optional(),
  batch_humidity_pct: z.number().optional(),
  batch_temp_c: z.number().optional(),
  burping_schedule: z.string().optional(),
  expected_days: z.number().int().positive().optional(),
});

export const LabSampleTakenSchema = base.extend({
  evt: z.literal("LAB_SAMPLE_TAKEN"),
  lab: orgRef,
  sample_qty_g: z.number().positive(),
  sample_id: z.string(),
  courier: z.string().optional(),
  tracking_number: z.string().optional(),
  tests_requested: z.array(z.string()).optional(),
});

export const LabResultReleasedSchema = base.extend({
  evt: z.literal("LAB_RESULT_RELEASED"),
  coa_uri: z.string(),
  coa_hash: z.string(),
  thc_pct: z.number().nonnegative(),
  cbd_pct: z.number().nonnegative(),
  cbg_pct: z.number().nonnegative().optional(),
  terpenes: z.record(z.string(), z.number()).optional(),
  pesticides: passFail.optional(),
  microbial: passFail.optional(),
  heavy_metals: passFail.optional(),
  lab_signature: z.string().optional(),
  lab_signed_at: z.number().int().optional(),
});

export const PackagedSchema = base.extend({
  evt: z.literal("PACKAGED"),
  package_type: z.string(),
  unit_size_g: z.number().positive(),
  units_count: z.number().int().positive(),
  qr_codes: z.array(z.string()).optional(),
  label_uri: z.string().optional(),
  expiration_date: z.string().optional(),
});

export const TransferredSchema = base.extend({
  evt: z.literal("TRANSFERRED"),
  from_cultivator: orgRef.optional(),
  to_dispensary: orgRef.optional(),
  transport_invoice_number: z.string().optional(),
  courier: z.string().optional(),
  transport_date: z.number().int().optional(),
  units_in_shipment: z.number().int().optional(),
  shipment_temp_log_uri: z.string().optional(),
});

export const DispensedSchema = base.extend({
  evt: z.literal("DISPENSED"),
  // SOMENTE hashes — nunca CPF/CNS/nome em claro.
  patient_hash: z.string(),
  prescription_hash: z.string(),
  prescriber_crm_hash: z.string(),
  units_dispensed: z.number().int().positive(),
  unit_codes: z.array(z.string()).optional(),
  dispensary_cnpj: z.string().optional(),
});

export const RecalledSchema = base.extend({
  evt: z.literal("RECALLED"),
  mode: z.enum(["individual", "batch", "mass"]).optional(),
  reason_code: z.string(),
  reason_text: z.string().optional(),
  anvisa_notice_uri: z.string().optional(),
  affected_batch_ids: z.array(z.string()).optional(),
  patients_to_notify_count: z.number().int().nonnegative().optional(),
  initiating_doc_hash: z.string().optional(),
});

export const DestroyedSchema = base.extend({
  evt: z.literal("DESTROYED"),
  reason: z.string(),
  method: z.string().optional(),
  witness_pubkey: z.string().optional(),
  weight_destroyed_g: z.number().nonnegative().optional(),
  destruction_authorization_doc_uri: z.string().optional(),
  video_uri: z.string().optional(),
});

/** União discriminada por `evt` — valida qualquer payload de evento. */
export const EventPayloadSchema = z.discriminatedUnion("evt", [
  SeedPlantedSchema,
  MotherRegisteredSchema,
  CloneCutSchema,
  VegetationStartSchema,
  FloweringStartSchema,
  HarvestSchema,
  DryingStartSchema,
  CuringStartSchema,
  LabSampleTakenSchema,
  LabResultReleasedSchema,
  PackagedSchema,
  TransferredSchema,
  DispensedSchema,
  RecalledSchema,
  DestroyedSchema,
]);

export type EventPayload = z.infer<typeof EventPayloadSchema>;

export const EVENT_SCHEMA_BY_TYPE: Record<EventType, z.ZodTypeAny> = {
  [EventType.SEED_PLANTED]: SeedPlantedSchema,
  [EventType.MOTHER_REGISTERED]: MotherRegisteredSchema,
  [EventType.CLONE_CUT]: CloneCutSchema,
  [EventType.VEGETATION_START]: VegetationStartSchema,
  [EventType.FLOWERING_START]: FloweringStartSchema,
  [EventType.HARVEST]: HarvestSchema,
  [EventType.DRYING_START]: DryingStartSchema,
  [EventType.CURING_START]: CuringStartSchema,
  [EventType.LAB_SAMPLE_TAKEN]: LabSampleTakenSchema,
  [EventType.LAB_RESULT_RELEASED]: LabResultReleasedSchema,
  [EventType.PACKAGED]: PackagedSchema,
  [EventType.TRANSFERRED]: TransferredSchema,
  [EventType.DISPENSED]: DispensedSchema,
  [EventType.RECALLED]: RecalledSchema,
  [EventType.DESTROYED]: DestroyedSchema,
};

export function schemaForType(t: EventType): z.ZodTypeAny {
  return EVENT_SCHEMA_BY_TYPE[t];
}

/**
 * Monta o payload completo e canônico-ready a partir de dados parciais da UI:
 * injeta `evt`, `schema_v` e `ts`, e VALIDA com o schema do tipo. Retorna o objeto
 * já parseado (sem chaves desconhecidas) — pronto pra canonicalizar e hashear.
 */
export function buildEventPayload(
  eventType: EventType,
  data: Record<string, unknown>,
  tsSeconds?: number,
): EventPayload {
  const candidate = {
    evt: eventName(eventType),
    schema_v: 1,
    ts: tsSeconds ?? Math.floor(Date.now() / 1000),
    ...data,
  };
  return EventPayloadSchema.parse(candidate);
}
