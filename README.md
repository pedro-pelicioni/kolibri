# Kolibri 🌱

**Rastreabilidade seed-to-sale da planta de cannabis medicinal — web, com Proof-of-Existence verificável na Solana.**

Plataforma de gestão e compliance para **dispensários** de cannabis medicinal no Brasil (tema LGPD + ANVISA RDC 1.015/2026 + SNGPC). Cada evento do ciclo de vida da planta — do nascimento à dispensação — é canonicalizado, hasheado (sha256) e **ancorado on-chain** na Solana. Cada planta vira um **NFT** (o certificado), e qualquer pessoa abre o **passaporte público** (Digital Product Passport) via QR e **verifica a prova on-chain**, sem nunca expor dados sensíveis (PII fica off-chain, só hash trafega).

> Trilha **Solana** · Hackanation 2026 (TokenNation) · **Repo:** https://github.com/pedro-pelicioni/kolibri

---

## 📸 Screenshots

| Home | Passaporte público (DPP) verificável on-chain |
|:---:|:---:|
| ![Home do Kolibri](docs/screenshots/01-login.png) | ![Passaporte público do Kolibri](docs/screenshots/02-passaporte.png) |

---

## ✅ Requisitos do Hackanation 2026 — status

| Requisito (regras) | Status |
|---|---|
| **Programa/Smart contract on-chain** (Solana, pode ser testnet/devnet, data após o início) | ✅ `kolibri_registry` publicado na **devnet** (deploy em jun/2026) |
| **Endereço público do contrato** | ✅ [`Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF`](https://explorer.solana.com/address/Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF?cluster=devnet) |
| **Contrato verificado em explorador público** | ✅ **build verificável** (bate byte-a-byte com o repo público) + **PDA de verificação on-chain** |
| **Código em um único repositório GitHub público** (contracts + back-end + frontend) | ✅ este monorepo — `programs/` + `apps/api` + `apps/web` |
| **Frontend com link público** (opcional, agrega valor) | ✅ **no ar no Render** (API + Postgres + web — ver [Deploy](#deploy-na-nuvem-render)) |
| **Projeto publicado na Taikai** (não-draft) | ✅ trilha Solana, visível a todos |
| **Vídeo 3–4 min (YouTube)** | ⬜ a gravar (roteiro: login → registrar planta → ancoragem → NFT → passaporte → verify) |
| **Pitch + transação ao vivo** | ✅ "Registrar planta" no app **É** a transação demonstrável (ancora + minta on-chain) |

---

## 🔗 Provas on-chain (devnet) — clique e confira

| O quê | Solana Explorer |
|---|---|
| **Programa** (`Executable: true`, verificado) | [`Bybi3n…fqnF`](https://explorer.solana.com/address/Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF?cluster=devnet) |
| **Tx do deploy** | [`56Vx…459s`](https://explorer.solana.com/tx/56Vx4J8BjTpYv5EUr6mpdL9kfj3ju6PGsG85t6cPz56ocwboWEx21KGpHXKXvTQpAAMbUnHxHUkPwZqL8BYj459s?cluster=devnet) |
| **Tx do PDA de verificação** | [`5to6…P2MA`](https://explorer.solana.com/tx/5to6nuP5KVbxUaoUPFPHPRUMXG5WnVmtgRGRc9zDRZyAR9KW88JYqpGcccx61moytvsv3xmoja2iuQe2HmZFP2MA?cluster=devnet) |
| **NFT de uma planta** (Metaplex Core) | [`Dd9t…nE5b`](https://explorer.solana.com/address/Dd9tExQ6NNokv83pbndRFGTJTHbVPWzuUo26vFYYnE5b?cluster=devnet) |
| **PDA de uma planta** (prova PoE) | [`DHYz…MWY9`](https://explorer.solana.com/address/DHYzh6bZkShtyq2eLE48hBmSJyPXmhNWbBLgpmkcMWY9?cluster=devnet) |

Todas as transações têm data posterior ao início do hackathon. O programa é **upgradeable** (authority pública) e tem **build verificável** (bytecode on-chain = código deste repo).

---

## O que está implementado

Este repositório é o **núcleo de rastreabilidade on-chain** do Kolibri (o pilar "rastreabilidade imutável" da visão de produto):

- **Auth de dispensário** via Sign-In With Solana (SIWS) + JWT.
- **Registro da planta** (origem/genética) → cria um `Batch` PDA on-chain + minta um **NFT Metaplex Core** (o certificado).
- **Eventos do ciclo de vida** (15 tipos: do plantio à dispensação) — cada um ancora `sha256(payload canônico)` on-chain. PII (CPF/CNS) **nunca** vai on-chain — só `sha256(valor)`, hasheado no navegador.
- **Passaporte público** (`/passport/:id`, alvo de QR) no padrão **Digital Product Passport (DPP)**: cartão + gauges + selos de compliance + abas + NFT + **"Verificar on-chain"** (recomputa o sha256 no navegador e confere a conta `Batch`).
- **Ancoragem server-custody**: o backend assina/paga (1 clique, sem popup por evento); o SIWS + o NFT amarram a identidade do dispensário.

---

## Arquitetura (monorepo pnpm + Turborepo)

```
kolibri/
├─ apps/
│  ├─ web/        # Vite + React + Tailwind v4 + wallet-adapter (SIWS) — dashboard, forms, passaporte
│  └─ api/        # Fastify + Prisma + Postgres — SIWS, canonical-JSON+sha256, worker de ancoragem
├─ packages/
│  ├─ types/      # @kolibri/types — 15 eventos (zod) + DTOs
│  ├─ sdk/        # @kolibri/sdk — canonicalize, sha256, ULID↔16b, client do programa, mappers do passaporte
│  └─ ui/         # @kolibri/ui — utilitários de UI
├─ programs/      # workspace Anchor/Rust (ISOLADO do pnpm)
│  └─ programs/kolibri-registry/   # programa Solana
├─ render.yaml    # blueprint de deploy (API + Postgres + web)
└─ docs/          # schemas dos 15 eventos (event-schemas.md é a fonte canônica)
```

**Programa Solana `kolibri_registry`** (Anchor 0.32.1, devnet — `Bybi3n…fqnF`):

| Instrução | O que faz |
|---|---|
| `register_plant(batch_id, dispensary, origin_event_type, origin_hash, storage_uri)` | Cria o PDA `Batch` (seeds `["batch", dispensary, batch_id]`), ancora o hash de origem (raiz PoE). |
| `record_event(event_type, payload_hash, storage_uri)` | Ancora o `sha256(payload)` de um evento; guarda o hash do último + contagem; emite `EventRecorded`. |
| `set_asset(asset)` | Vincula o NFT Metaplex Core (mintado off-chain via umi) ao lote. |

---
## Decisões & escopo

- **Server-custody** na ancoragem (UX de demo + confiabilidade); identidade via SIWS + NFT.
- **NFT mintado pela API (umi)** + vinculado on-chain por `set_asset` — robusto, sem CPI Rust frágil.
- **Anchor 0.32.1** 
- PoE com **sha256** (canonical JSON estilo JCS); PII sempre como hash. Storage de uploads local no MVP (IPFS/Shadow são evolução).
- **Fora deste MVP** (visão/Fase 2): Cloak (pagamentos shielded), NF-e/SNGPC automatizados, token KNECT.

## Status técnico

| Componente | Estado |
|---|---|
| Programa `kolibri_registry` | ✅ build + 5/5 testes + **deploy + verificado na devnet** |
| API (SIWS, CRUD, worker, passaporte, verify) | ✅ E2E validado na devnet (NFT minta + sha256 confere 3/3) |
| Web (login, dashboard, forms, passaporte DPP + verify) | ✅ builda + renderiza com dados reais |
| Deploy nuvem (Render) | ✅ API + Postgres + web no ar (blueprint `render.yaml`) |

> Docs dos 15 eventos: [`docs/event-schemas.md`](./docs/event-schemas.md). Arquitetura mobile anterior ao pivô: `HANDOFF.md`/`docs/MOBILE.md` (legado).
