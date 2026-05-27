# Kolibri

**Rastreabilidade da planta seed-to-sale, no Solana Seeker.**

ERP móvel para dispensários de cannabis no Brasil — LGPD + ANVISA RDC 1.015/2026 + SNGPC. Cada evento de vida da planta (do plantio à dispensação) é anchorado on-chain via [DPO2U](https://dpo2u.com).

---

## Status

🟡 **Preparação inicial.** O backend HTTP, programa Solana e SDK já estão prontos e em produção. Falta o app mobile React Native — escopo deste repositório.

| Componente | Status | Quem |
|---|---|---|
| Programa Solana (`compliance-registry-pinocchio` selector 0x06) | ✅ LIVE devnet | DPO2U |
| TypeScript SDK (`@dpo2u/client-sdk`) | ✅ Shipped | DPO2U |
| Backend HTTP (`kolibri-gateway`) | ✅ LIVE em `https://dpo2u.com/kolibri` | DPO2U |
| Compliance MCP (DPIA, ROPA, recall, audit) | ✅ LIVE em `mcp.dpo2u.com` | DPO2U |
| **App React Native (este repo)** | ⏳ A começar | **Pedro Pelicioni** |
| Mainnet deploy | ⏳ Pós-DPIA + ROPA + dry-run | Conjunto |

---

## Próximo passo (Pedro)

Leia **[HANDOFF.md](./HANDOFF.md)** — quickstart Day-0 com setup React Native + Solana Mobile RN SDK + integração com o gateway.

Documentação completa em:
- **[docs/MOBILE.md](./docs/MOBILE.md)** — guia de integração mobile (SIWS, MWA, fluxo de telas, roadmap de 6 sprints)
- **[docs/event-schemas.md](./docs/event-schemas.md)** — schemas JSON canônicos dos 15 tipos de evento da planta
- **[docs/PRD-v1.2-Section-7.4-DPO2U-MCP.md](./docs/PRD-v1.2-Section-7.4-DPO2U-MCP.md)** — texto pronto pra anexar no seu PRD v1.2 (Seção 7.4 + DPA outline)

---

## Visão geral

```
Solana Seeker (Android)
   │
   ▼
React Native App (este repo)
   │ HTTPS + Bearer JWT
   ▼
https://dpo2u.com/kolibri (Fastify gateway)
   │
   ├─→ Postgres (events + batches + recalls)
   ├─→ Solana devnet/mainnet (selector 0x06)
   ├─→ Shadow Drive (payloads imutáveis cifrados)
   └─→ mcp.dpo2u.com (compliance, DPIA, score)
```

O app usa **Mobile Wallet Adapter (MWA)** do Solana Seeker para assinar transações — sem custódia, biometria nativa via Seed Vault.

---

## 15 tipos de evento da planta

| # | Tipo | Quem dispara |
|---|---|---|
| 1 | SEED_PLANTED | Cultivador |
| 2 | MOTHER_REGISTERED | Cultivador |
| 3 | CLONE_CUT | Cultivador |
| 4 | VEGETATION_START | Cultivador |
| 5 | FLOWERING_START | Cultivador |
| 6 | HARVEST | Cultivador |
| 7 | DRYING_START | Cultivador |
| 8 | CURING_START | Cultivador |
| 9 | LAB_SAMPLE_TAKEN | Cultivador / Lab |
| 10 | LAB_RESULT_RELEASED | Lab |
| 11 | PACKAGED | Cultivador |
| 12 | TRANSFERRED | Cultivador → Dispensário |
| 13 | DISPENSED | Dispensário (com hash do paciente, NUNCA PII) |
| 14 | RECALLED | Cultivador / Dispensário / Admin |
| 15 | DESTROYED | Cultivador / Admin |

Schemas detalhados de cada payload em [docs/event-schemas.md](./docs/event-schemas.md).

---

## URLs canônicas

```
Gateway base:    https://dpo2u.com/kolibri
OpenAPI spec:    https://dpo2u.com/kolibri/openapi.json   (use openapi-typescript pra gerar tipos)
Health probe:    https://dpo2u.com/kolibri/health
Program ID:      FZ21S53Rn8Y6ANfccS2waCrkYWh5zfjXK3hkKU5YSkJ8
Agent Registry:  5qeuUAaJi9kTzsfmiphQ89PNrpqy7xW7sCvhBZQ6mya7
MCP:             https://mcp.dpo2u.com
```

---

## Modelo comercial

**DPO2U disponibiliza tudo open ao Kolibri** — sem licença, sem revenue share. Use à vontade. Stack completo:

- 4 programas Solana (compliance-registry-pinocchio + agent-registry + legal-source-manifest + consent-manager)
- TypeScript SDK tipado (`@dpo2u/client-sdk`)
- 70+ MCP tools (compliance, DPIA, audit) via `mcp.dpo2u.com`
- Backend HTTP completo (`kolibri-gateway`) já deployed em produção
- Postgres migrations
- DPA LGPD operador (modelo pronto)
- Worker de reconciliação banco↔chain

Repos de referência:
- [`fredericosanntana/dpo2u-solana`](https://github.com/fredericosanntana/dpo2u-solana) — programa + SDK
- [`fredericosanntana/DPO2U`](https://github.com/fredericosanntana/DPO2U) — backend gateway + MCP

---

## Contato

- **Pedro Pelicioni** — dono deste repo, dev do app
- **Frederico Santana** (DPO2U) — fredericosanntana@gmail.com — backend + on-chain + compliance

Decisões fechadas e plano técnico completo: ver [HANDOFF.md](./HANDOFF.md).
