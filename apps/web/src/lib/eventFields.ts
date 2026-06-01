import { sha256Hex } from "@kolibri/sdk";
import { EventType } from "@kolibri/types";

export type FieldKind = "text" | "number" | "date" | "select" | "hash" | "photo" | "coa";

export interface FieldSpec {
  /** Caminho (dotted) dentro do payload, ex.: "supplier.cnpj". */
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  hint?: string;
}

/** Campos por tipo de evento (cobre os campos obrigatórios dos schemas zod do @kolibri/types). */
export const EVENT_FIELDS: Record<number, FieldSpec[]> = {
  [EventType.SEED_PLANTED]: [
    { key: "seed_lot_id", label: "Lote da semente", kind: "text", required: true },
    { key: "qty", label: "Quantidade", kind: "number", required: true },
    { key: "supplier.name", label: "Fornecedor", kind: "text" },
    { key: "supplier.cnpj", label: "CNPJ do fornecedor", kind: "text" },
    { key: "germination_method", label: "Método de germinação", kind: "text" },
    { key: "photos[]", label: "Foto", kind: "photo" },
  ],
  [EventType.MOTHER_REGISTERED]: [
    { key: "cultivar_full", label: "Cultivar (nome completo)", kind: "text", required: true },
    { key: "genotype", label: "Genótipo", kind: "text" },
    { key: "phenotype_notes", label: "Origem / notas de fenótipo", kind: "text" },
    { key: "photos[]", label: "Foto", kind: "photo" },
  ],
  [EventType.CLONE_CUT]: [
    { key: "cut_count", label: "Nº de clones", kind: "number", required: true },
    { key: "cutting_method", label: "Método de corte", kind: "text" },
    { key: "destination_tray", label: "Bandeja destino", kind: "text" },
  ],
  [EventType.VEGETATION_START]: [
    { key: "light_hours", label: "Horas de luz", kind: "number", required: true },
    { key: "temperature_c_avg", label: "Temp. média (°C)", kind: "number" },
    { key: "humidity_pct_avg", label: "Umidade média (%)", kind: "number" },
  ],
  [EventType.FLOWERING_START]: [
    { key: "light_hours", label: "Horas de luz", kind: "number", required: true },
    { key: "expected_harvest_date", label: "Colheita prevista", kind: "date" },
  ],
  [EventType.HARVEST]: [
    { key: "wet_weight_g", label: "Peso úmido (g)", kind: "number", required: true },
    { key: "trichome_status", label: "Status dos tricomas", kind: "text" },
    { key: "photos[]", label: "Foto", kind: "photo" },
  ],
  [EventType.DRYING_START]: [
    { key: "drying_method", label: "Método de secagem", kind: "text" },
    { key: "expected_days", label: "Dias previstos", kind: "number" },
  ],
  [EventType.CURING_START]: [
    { key: "container", label: "Recipiente", kind: "text" },
    { key: "expected_days", label: "Dias previstos", kind: "number" },
  ],
  [EventType.LAB_SAMPLE_TAKEN]: [
    { key: "lab.cnpj", label: "CNPJ do laboratório", kind: "text", required: true },
    { key: "lab.name", label: "Laboratório", kind: "text" },
    { key: "sample_qty_g", label: "Qtd. amostra (g)", kind: "number", required: true },
    { key: "sample_id", label: "ID da amostra", kind: "text", required: true },
  ],
  [EventType.LAB_RESULT_RELEASED]: [
    { key: "coa", label: "Certificado (COA, PDF)", kind: "coa", required: true },
    { key: "thc_pct", label: "THC (%)", kind: "number", required: true },
    { key: "cbd_pct", label: "CBD (%)", kind: "number", required: true },
    { key: "pesticides", label: "Pesticidas", kind: "select", options: ["pass", "fail"] },
    { key: "microbial", label: "Microbiológico", kind: "select", options: ["pass", "fail"] },
    { key: "heavy_metals", label: "Metais pesados", kind: "select", options: ["pass", "fail"] },
  ],
  [EventType.PACKAGED]: [
    { key: "package_type", label: "Tipo de embalagem", kind: "text", required: true },
    { key: "unit_size_g", label: "Tamanho da unidade (g)", kind: "number", required: true },
    { key: "units_count", label: "Nº de unidades", kind: "number", required: true },
    { key: "expiration_date", label: "Validade", kind: "date" },
  ],
  [EventType.TRANSFERRED]: [
    { key: "to_dispensary.cnpj", label: "CNPJ do dispensário destino", kind: "text" },
    { key: "to_dispensary.name", label: "Dispensário destino", kind: "text" },
    { key: "transport_invoice_number", label: "Nº da nota", kind: "text" },
    { key: "units_in_shipment", label: "Unidades no envio", kind: "number" },
  ],
  [EventType.DISPENSED]: [
    { key: "patient_hash", label: "Identificador do paciente (CNS)", kind: "hash", required: true, hint: "Hasheado no navegador — o valor cru nunca sai daqui." },
    { key: "prescription_hash", label: "Receita", kind: "hash", required: true, hint: "Hasheado no navegador." },
    { key: "prescriber_crm_hash", label: "CRM do prescritor", kind: "hash", required: true, hint: "Hasheado no navegador." },
    { key: "units_dispensed", label: "Unidades dispensadas", kind: "number", required: true },
  ],
  [EventType.RECALLED]: [
    { key: "reason_code", label: "Código do motivo", kind: "text", required: true },
    { key: "reason_text", label: "Descrição", kind: "text" },
    { key: "mode", label: "Modo", kind: "select", options: ["individual", "batch", "mass"] },
  ],
  [EventType.DESTROYED]: [
    { key: "reason", label: "Motivo", kind: "text", required: true },
    { key: "method", label: "Método", kind: "text" },
    { key: "weight_destroyed_g", label: "Peso descartado (g)", kind: "number" },
  ],
};

/** Resultado de um upload (foto/COA). */
export interface UploadArtifact {
  storageUri: string;
  sha256Hex: string;
}

function setDeep(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    if (typeof cur[p] !== "object" || cur[p] === null) cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

/**
 * Constrói o payload do evento a partir dos valores do form + uploads.
 * - number → Number; hash → sha256Hex(valor); photos[] → array; coa → coa_uri + coa_hash.
 */
export function buildEventPayloadData(
  fields: FieldSpec[],
  values: Record<string, string>,
  uploads: Record<string, UploadArtifact>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.kind === "photo") {
      const up = uploads[f.key];
      if (up) payload.photos = [...((payload.photos as string[]) ?? []), up.storageUri];
      continue;
    }
    if (f.kind === "coa") {
      const up = uploads[f.key];
      if (up) {
        payload.coa_uri = up.storageUri;
        payload.coa_hash = up.sha256Hex;
      }
      continue;
    }
    const raw = values[f.key];
    if (raw === undefined || raw === "") continue;
    if (f.kind === "number") {
      setDeep(payload, f.key, Number(raw));
    } else if (f.kind === "hash") {
      setDeep(payload, f.key, sha256Hex(raw));
    } else {
      setDeep(payload, f.key, raw);
    }
  }
  return payload;
}
