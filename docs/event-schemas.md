# Cannabis Event Payload Schemas

Para cada um dos 15 tipos de evento (selector 0x06), o Kolibri **canonicaliza um JSON off-chain**, sobe pra IPFS/Shadow Drive, e anchora o `sha256(canonical_json)` + `storage_uri` on-chain.

Regras gerais:
- **NUNCA** colocar CPF, CNS, nome, endereço, condição clínica direto no payload — usar hash (sha256) e guardar PII no Postgres cifrado.
- Todos os timestamps em **Unix segundos UTC**.
- Canonical JSON = chaves ordenadas alfabeticamente + sem espaços (compatível com JCS RFC 8785).
- `op` (operador) é o usuário do Kolibri que executou o evento (hash do user_id, não nome).

---

## 1. SEED_PLANTED

```json
{
  "evt": "SEED_PLANTED",
  "schema_v": 1,
  "supplier": { "cnpj": "12.345.678/0001-90", "name": "Sementeira Tech BR" },
  "seed_lot_id": "SL-2026-Q1-042",
  "qty": 50,
  "location": { "facility_id": "EST-01", "room": "germ-A", "tray": "T-12" },
  "germination_method": "rockwool",
  "photos": ["ipfs://Qm.../seed_tray.jpg"],
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 2. MOTHER_REGISTERED

```json
{
  "evt": "MOTHER_REGISTERED",
  "schema_v": 1,
  "cultivar_full": "Charlotte's Web F2",
  "genotype": "70% indica / 30% sativa",
  "phenotype_notes": "broad leaf, dense node spacing, vigorous root system",
  "mother_pot_id": "POT-M-007",
  "location": { "facility_id": "EST-01", "room": "mom-A" },
  "photos": ["ipfs://Qm.../mom_full.jpg", "ipfs://Qm.../mom_leaf.jpg"],
  "expected_lifespan_days": 720,
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 3. CLONE_CUT

```json
{
  "evt": "CLONE_CUT",
  "schema_v": 1,
  "cut_count": 12,
  "cutting_method": "diagonal-45-rockwool",
  "rooting_hormone": "Clonex",
  "expected_root_days": 14,
  "destination_tray": "PROP-A-3",
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 4. VEGETATION_START

```json
{
  "evt": "VEGETATION_START",
  "schema_v": 1,
  "light_hours": 18,
  "temperature_c_avg": 24.5,
  "humidity_pct_avg": 65,
  "nutrient_recipe_id": "VEG-A-2026",
  "pot_size_l": 3.5,
  "co2_ppm_target": 1200,
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 5. FLOWERING_START

```json
{
  "evt": "FLOWERING_START",
  "schema_v": 1,
  "light_hours": 12,
  "pinch_method": "topping-x2",
  "expected_harvest_date": "2026-09-15",
  "nutrient_recipe_id": "BLOOM-A-2026",
  "ec_target": 1.8,
  "ph_target": 6.2,
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 6. HARVEST

```json
{
  "evt": "HARVEST",
  "schema_v": 1,
  "harvest_method": "whole-plant-chop",
  "wet_weight_g": 480,
  "plant_count": 12,
  "trichome_status": "60% milky, 40% amber",
  "photos": ["ipfs://Qm.../harvest1.jpg"],
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 7. DRYING_START

```json
{
  "evt": "DRYING_START",
  "schema_v": 1,
  "drying_method": "hang-dry-rack",
  "target_humidity_pct": 60,
  "target_temp_c": 18,
  "room_id": "DRY-01",
  "expected_days": 10,
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 8. CURING_START

```json
{
  "evt": "CURING_START",
  "schema_v": 1,
  "container": "glass-CVault-58",
  "batch_humidity_pct": 62,
  "batch_temp_c": 18,
  "burping_schedule": "2x/day-week1, 1x/day-week2",
  "expected_days": 21,
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 9. LAB_SAMPLE_TAKEN

```json
{
  "evt": "LAB_SAMPLE_TAKEN",
  "schema_v": 1,
  "lab": { "cnpj": "12.345.678/0001-90", "name": "ANVISA Cert Lab SP" },
  "sample_qty_g": 5.2,
  "sample_id": "S-2026-08-127",
  "courier": "Sedex",
  "tracking_number": "BR123456789BR",
  "tests_requested": ["thc","cbd","terpenes","pesticides","microbial","heavy_metals"],
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 10. LAB_RESULT_RELEASED

```json
{
  "evt": "LAB_RESULT_RELEASED",
  "schema_v": 1,
  "coa_uri": "ipfs://Qm.../coa-batch-X-signed.pdf",
  "coa_hash": "f3a1…",
  "thc_pct": 0.15,
  "cbd_pct": 8.4,
  "cbg_pct": 1.2,
  "terpenes": { "myrcene": 0.32, "limonene": 0.18, "pinene": 0.09 },
  "pesticides": "pass",
  "microbial": "pass",
  "heavy_metals": "pass",
  "lab_signature": "ed25519:base58:…",
  "lab_signed_at": 1700000000,
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 11. PACKAGED

```json
{
  "evt": "PACKAGED",
  "schema_v": 1,
  "package_type": "glass-jar",
  "unit_size_g": 10,
  "units_count": 24,
  "qr_codes": ["KB-X-001","KB-X-002","KB-X-003"],
  "label_uri": "ipfs://Qm.../label-X-batch.pdf",
  "expiration_date": "2027-08-31",
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 12. TRANSFERRED

```json
{
  "evt": "TRANSFERRED",
  "schema_v": 1,
  "from_cultivator": { "cnpj": "12.345.678/0001-90", "name": "GrowCo BR" },
  "to_dispensary": { "cnpj": "98.765.432/0001-10", "name": "Dispensário X" },
  "transport_invoice_number": "NF-2026-0042",
  "courier": "Loggi Cargo",
  "transport_date": 1700000000,
  "units_in_shipment": 24,
  "shipment_temp_log_uri": "ipfs://Qm.../temp-log.csv",
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 13. DISPENSED

```json
{
  "evt": "DISPENSED",
  "schema_v": 1,
  "patient_hash": "sha256:cns:1ab2c3...",
  "prescription_hash": "sha256:doc:f4e5d6...",
  "prescriber_crm_hash": "sha256:crm:7a8b9c...",
  "units_dispensed": 2,
  "unit_codes": ["KB-X-013","KB-X-014"],
  "dispensary_cnpj": "98.765.432/0001-10",
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

> **IMPORTANTE**: `patient_hash` = `sha256(CNS_completo + salt_tenant)`. NUNCA gravar CPF/CNS plain. Salt fica no Postgres do Kolibri, não no payload.

## 14. RECALLED

```json
{
  "evt": "RECALLED",
  "schema_v": 1,
  "mode": "individual",
  "reason_code": "LAB_RETEST_FAIL",
  "reason_text": "Re-teste detectou pesticida fipronil acima do limite ANVISA",
  "anvisa_notice_uri": "https://gov.br/anvisa/notice/2026-1234",
  "affected_batch_ids": ["01HKAB0K2YY8HJZBN3D5P3V5Y0"],
  "patients_to_notify_count": 4,
  "initiating_doc_hash": "sha256:retest_report:d4e5f6...",
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

## 15. DESTROYED

```json
{
  "evt": "DESTROYED",
  "schema_v": 1,
  "reason": "powdery_mildew_outbreak",
  "method": "incineration-witnessed",
  "witness_pubkey": "ed25519:base58:…",
  "weight_destroyed_g": 285,
  "destruction_authorization_doc_uri": "ipfs://Qm.../destruction-auth.pdf",
  "video_uri": "ipfs://Qm.../destruction-video.mp4",
  "op_hash": "a4f2…",
  "ts": 1700000000
}
```

---

## Canonicalization rules

1. Keys ordered alphabetically (recursively for nested objects)
2. No whitespace between tokens
3. UTF-8 encoding
4. Booleans, numbers, null in standard JSON form
5. SHA-256 of canonicalized bytes = `payload_hash` field on-chain

JavaScript:
```ts
function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonicalize).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalize(obj[k])).join(",") + "}";
}
const payloadHash = createHash("sha256").update(canonicalize(payload)).digest();
```

## Storage flow (production)

1. Kolibri UI captura inputs (formulário, fotos, etc) → monta `payload` JSON
2. `payload_canonical = canonicalize(payload)`
3. `payload_hash = sha256(payload_canonical)`
4. Upload `payload_canonical` para Shadow Drive (make-immutable) → recebe `shadow_uri`
5. Chama `submitEvent({ payloadHash, storageUri: shadow_uri, ... })`
6. Grava em `traceability_events` com `payload_json=payload` (Postgres) + `payload_hash` + `storage_uri` + status `anchored_at=NULL`
7. Worker async pega e anchora on-chain → atualiza `anchored_at`/`solana_pda`/`solana_tx_signature`

Auditor ANVISA verifica:
- Fetch on-chain PDA → lê `payload_hash` + `storage_uri`
- Download `payload_canonical` do storage_uri
- Recalcula sha256 → confere se bate com on-chain
- Valida assinatura da authority via cross-program agent-registry
