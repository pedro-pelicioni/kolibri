# Kolibri 🌱

**Rastreabilidade seed-to-sale da planta de cannabis medicinal — web, com Proof-of-Existence verificável na Solana.**

Plataforma de gestão e compliance para **dispensários** de cannabis medicinal no Brasil (tema LGPD + ANVISA RDC 1.015/2026 + SNGPC). Cada evento do ciclo de vida da planta — do nascimento à dispensação — é canonicalizado, hasheado (sha256) e **ancorado on-chain** na Solana. Cada planta vira um **NFT** (o certificado), e qualquer pessoa abre o **passaporte público** (estilo Minespider) via QR e **verifica a prova on-chain**, sem nunca expor dados sensíveis (PII fica off-chain, só hash trafega).

> Trilha **Solana** · Hackanation 2026 (TokenNation) · **Repo:** https://github.com/pedro-pelicioni/kolibri

---

## ✅ Requisitos do Hackanation 2026 — status

| Requisito (regras) | Status |
|---|---|
| **Programa/Smart contract on-chain** (Solana, pode ser testnet/devnet, data após o início) | ✅ `kolibri_registry` publicado na **devnet** (deploy em jun/2026) |
| **Endereço público do contrato** | ✅ [`Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF`](https://explorer.solana.com/address/Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF?cluster=devnet) |
| **Contrato verificado em explorador público** | ✅ **build verificável** (bate byte-a-byte com o repo público) + **PDA de verificação on-chain** |
| **Código em um único repositório GitHub público** (contracts + back-end + frontend) | ✅ este monorepo — `programs/` + `apps/api` + `apps/web` |
| **Frontend com link público** (opcional, agrega valor) | 🟡 deploy via **Render** (seção [Deploy](#deploy-na-nuvem-render)) → `kolibri-web.onrender.com` |
| **Projeto publicado na Taikai** (não-draft) | ✅ trilha Solana, visível a todos |
| **Vídeo 3–4 min (YouTube)** | ⬜ a gravar (roteiro: login → registrar planta → ancoragem → NFT → passaporte → verify) |
| **Pitch + transação ao vivo** | ✅ "Registrar planta" no app **É** a transação demonstrável (ancora + minta on-chain) |

**Provar a verificação ao vivo** (qualquer pessoa roda):
```bash
solana-verify verify-from-repo --base-image solanafoundation/solana-verifiable-build:3.1.12 \
  --mount-path programs --library-name kolibri_registry \
  --program-id Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF \
  -u devnet https://github.com/pedro-pelicioni/kolibri
# → "Program hash matches ✅"
```
> O **selo verde do Solscan** é mainnet-only (o serviço remoto da OtterSec rejeita devnet). Na devnet a verificação é real e comprovável pelo comando acima + pelo PDA on-chain.

---

## O que está implementado

Este repositório é o **núcleo de rastreabilidade on-chain** do Kolibri (o pilar "rastreabilidade imutável" da visão de produto):

- **Auth de dispensário** via Sign-In With Solana (SIWS) + JWT.
- **Registro da planta** (origem/genética) → cria um `Batch` PDA on-chain + minta um **NFT Metaplex Core** (o certificado).
- **Eventos do ciclo de vida** (15 tipos: do plantio à dispensação) — cada um ancora `sha256(payload canônico)` on-chain. PII (CPF/CNS) **nunca** vai on-chain — só `sha256(valor)`, hasheado no navegador.
- **Passaporte público** (`/passport/:id`, alvo de QR) estilo Minespider: cartão + gauges + selos de compliance + abas + NFT + **"Verificar on-chain"** (recomputa o sha256 no navegador e confere a conta `Batch`).
- **Ancoragem server-custody**: o backend assina/paga (1 clique, sem popup por evento); o SIWS + o NFT amarram a identidade do dispensário.

---

## Arquitetura (monorepo pnpm + Turborepo)

```
kolibri/
├─ apps/
│  ├─ web/        # Vite + React + Tailwind v4 + wallet-adapter (SIWS) — dashboard, forms, passaporte
│  └─ api/        # Fastify + Prisma + Postgres — SIWS, canonical-JSON+sha256, worker de ancoragem, faucet
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

## Rodar local

**Pré-requisitos:** Node ≥20, pnpm 11 (`corepack enable`), Docker, Rust + Solana CLI + Anchor (`avm use 0.32.1`).

```bash
pnpm install
docker compose up -d db                                  # Postgres
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm --filter @kolibri/api exec prisma migrate dev
pnpm anchor:build && pnpm anchor:test                    # programa: 5/5 testes (validador local)
pnpm dev                                                 # API :8080 + web :5173
```

**E2E sem navegador** (SIWS programático → registro → ancoragem → NFT → passaporte → verify):
```bash
pnpm --filter @kolibri/api exec tsx scripts/e2e.ts       # → "✅ E2E OK" (sha256 3/3)
```

---

## Deploy na devnet (1 comando)

```bash
# 1. financie a wallet de deploy/serviço (~2 SOL) no faucet:
#    https://faucet.solana.com  →  CNxuU4hTR8yyqmKb24KKpsYbtiiV51zZ5kopTmxyvHuo
# 2. deploy + aponta API/web pra devnet:
pnpm deploy:devnet
```
Na devnet o **NFT Metaplex Core minta de verdade** e os links do Explorer + "Verificar on-chain" funcionam. Manual: `pnpm anchor:deploy` e ajustar `SOLANA_RPC_URL`/`VITE_SOLANA_RPC_URL`.

---

## Deploy na nuvem (Render)

O frontend público (e a API + DB) sobem no **Render** com o blueprint `render.yaml` incluído.

**Passo a passo:**

1. **Repo público no GitHub** ✅ (já está).
2. No Render → **New → Blueprint** → conecte `pedro-pelicioni/kolibri`. Ele lê o `render.yaml` e cria 3 recursos: **Postgres** (`kolibri-db`), **API** (`kolibri-api`) e **site estático** (`kolibri-web`).
3. No serviço **kolibri-api**, preencha o secret **`SERVICE_KEYPAIR_JSON`** com o conteúdo do seu keypair de serviço (o array do `~/.config/solana/id.json`):
   ```bash
   cat ~/.config/solana/id.json   # copie o array [12,34,...]
   ```
   *(É a mesma wallet `CNxuU4…` que ancora/minta — mantenha-a com SOL de devnet.)*
4. **Apply** → o Render builda tudo. As URLs ficam:
   - Web: `https://kolibri-web.onrender.com`  ← **link público do frontend (requisito)**
   - API: `https://kolibri-api.onrender.com`

> Se o Render adicionar um sufixo ao nome (caso já exista), ajuste `VITE_API_BASE_URL`, `API_PUBLIC_URL`, `APP_DOMAIN` e `PUBLIC_PASSPORT_BASE_URL` no painel pras URLs reais.
>
> Notas do plano free: o web service **hiberna** após inatividade (1ª request fria demora ~30s) e o Postgres free expira em 90 dias. Uploads usam disco efêmero (resetam no redeploy) — ok pra demo.

---

## Verificação no explorador (como cumprimos)

O equivalente Solana ao Etherscan é o **Solana Explorer / Solscan**. O contrato está:

1. **Público na devnet** — visível em [explorer.solana.com](https://explorer.solana.com/address/Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF?cluster=devnet) (`Executable: true`).
2. **Verificado (verifiable build)** — o bytecode on-chain (hash `9323a3c5…c991`) bate com o **build reproduzível** do código-fonte deste repo (imagem `solanafoundation/solana-verifiable-build:3.1.12`), e um **PDA de verificação** foi gravado on-chain ligando o programa ao GitHub. É o equivalente à verificação de fonte do Etherscan.

---

## Decisões & escopo

- **Server-custody** na ancoragem (UX de demo + confiabilidade); identidade via SIWS + NFT.
- **NFT mintado pela API (umi)** + vinculado on-chain por `set_asset` — robusto, sem CPI Rust frágil.
- **Anchor 0.32.1** (0.30.1 quebra com Rust/proc-macro2 modernos). Override pnpm de `@noble/hashes` v2→1.8 (metaplex precisa de `/sha3`).
- PoE com **sha256** (canonical JSON estilo JCS); PII sempre como hash. Storage de uploads local no MVP (IPFS/Shadow são evolução).
- **Fora deste MVP** (visão/Fase 2): Cloak (pagamentos shielded), NF-e/SNGPC automatizados, token KNECT.

## Status técnico

| Componente | Estado |
|---|---|
| Programa `kolibri_registry` | ✅ build + 5/5 testes + **deploy + verificado na devnet** |
| API (SIWS, CRUD, worker, passaporte, verify, faucet) | ✅ E2E validado na devnet (NFT minta + sha256 confere 3/3) |
| Web (login, dashboard, forms, passaporte DPP + verify) | ✅ builda + renderiza com dados reais |
| Deploy nuvem | 🟡 `render.yaml` pronto — rodar o blueprint pro link público |

> Docs dos 15 eventos: [`docs/event-schemas.md`](./docs/event-schemas.md). Arquitetura mobile anterior ao pivô: `HANDOFF.md`/`docs/MOBILE.md` (legado).
