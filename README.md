# Kolibri

**Rastreabilidade seed-to-sale da planta de cannabis medicinal — web, com Proof-of-Existence na Solana.**

Cada evento do ciclo de vida da planta (do nascimento à dispensação) é canonicalizado, hasheado (sha256) e **ancorado on-chain** na Solana. Cada planta vira um **NFT** (o certificado), e qualquer pessoa pode abrir o **passaporte público** (estilo Minespider) via QR e **verificar a prova on-chain** — sem nunca expor dados sensíveis (PII fica off-chain, só hash trafega).

Público-alvo: **dispensários**. Tema regulatório: LGPD + ANVISA RDC 1.015/2026 + SNGPC.

> Este repositório é a **versão web** (pivô do app mobile Seeker original). Feito para o hackathon **Hackanation 2026** (co-host Solana).

---

## Arquitetura

```
                          ┌─────────────────────────────┐
   Dispensário (web)      │  apps/web — Vite + React     │
   Phantom/Solflare ──────▶  SIWS + JWT, dashboard,      │
                          │  forms, passaporte público   │
                          └──────────────┬──────────────┘
                                         │ HTTPS + Bearer JWT
                          ┌──────────────▼──────────────┐
                          │  apps/api — Fastify + Prisma │
                          │  SIWS · CRUD · canonicalize+ │
                          │  sha256 · worker de ancoragem│
                          └───────┬───────────────┬──────┘
                                  │               │
                         Postgres │               │ @kolibri/sdk
                    (payloads,    │               │
                     hashes, PII  │     ┌─────────▼──────────┐
                     só hasheada) │     │  programs/         │
                                  │     │  kolibri_registry  │
                                  │     │  (Anchor, devnet)  │
                                  │     │  Batch PDA + PoE   │
                                  │     └─────────┬──────────┘
                                  │               │ CPI/umi
                                  │     ┌─────────▼──────────┐
                                  │     │  Metaplex Core     │
                                  │     │  (NFT da planta)   │
                                  └─────┴────────────────────┘
```

**Monorepo** (pnpm + Turborepo):

```
kolibri/
├─ apps/
│  ├─ web/        # Vite + React + Tailwind v4 + wallet-adapter (SIWS)
│  └─ api/        # Fastify + Prisma + Postgres + worker de ancoragem
├─ packages/
│  ├─ types/      # @kolibri/types — 15 eventos (zod) + DTOs
│  ├─ sdk/        # @kolibri/sdk — canonicalize, sha256, ULID↔16b, client do programa
│  └─ ui/         # @kolibri/ui — utilitários de UI
├─ programs/      # workspace Anchor/Rust (ISOLADO do pnpm)
│  └─ programs/kolibri-registry/   # programa Solana
└─ docs/          # schemas dos eventos + docs (event-schemas.md é a fonte canônica)
```

**Por que `programs/` é separado:** ele é um workspace Cargo/Anchor próprio. O `pnpm-workspace.yaml` lista só `apps/*` e `packages/*` — o pnpm nunca enxerga as crates Rust, e não há `Cargo.toml` na raiz do repo, então o Cargo não tenta absorver `node_modules`.

---

## Programa Solana — `kolibri_registry`

Program ID (devnet/localnet): `Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF`

| Instrução | O que faz |
|---|---|
| `register_plant(batch_id, dispensary, origin_event_type, origin_hash, storage_uri)` | Cria o PDA `Batch` (seeds `["batch", dispensary, batch_id]`), ancora o hash de origem (raiz PoE). |
| `record_event(event_type, payload_hash, storage_uri)` | Ancora o `sha256(payload canônico)` de um evento; guarda o hash do último + contagem; emite `EventRecorded`. |
| `set_asset(asset)` | Vincula o NFT Metaplex Core (mintado off-chain via umi) ao lote. |

**Custódia:** *server-custody* — o backend assina/ancora com a keypair de serviço (1 clique, sem popup por evento). O **SIWS + o banco amarram a identidade do dispensário**, e o **NFT é dono do dispensário** (proveniência on-chain). Self-custody (a wallet do dispensário assinar cada evento) é um toggle futuro.

**Privacidade:** nenhum CPF/CNS/dado clínico vai on-chain. PII entra só como `sha256(valor)` (hasheado no navegador, em `DISPENSED`). On-chain trafegam apenas hashes + `storage_uri`.

---

## Como rodar (local)

**Pré-requisitos:** Node ≥20, pnpm 11 (`corepack enable`), Docker, Rust + Solana CLI + Anchor (`avm use 0.32.1`).

```bash
# 1. Dependências
pnpm install

# 2. Postgres + migrations
docker compose up -d db
cp apps/api/.env.example apps/api/.env      # ajuste se necessário
cp apps/web/.env.example apps/web/.env
pnpm --filter @kolibri/api exec prisma migrate dev

# 3. Programa Anchor (testes em validador local — não gasta SOL de devnet)
pnpm anchor:build
pnpm anchor:test            # 5/5 testes

# 4. Dev (API :8080 + web :5173)
pnpm dev
```

**E2E sem navegador** (sobe um validador local, deploya, financia e roda o fluxo completo):

```bash
solana-test-validator --reset &                 # chain local
solana airdrop 100 --url http://localhost:8899
( cd programs && anchor deploy --provider.cluster localnet )
# aponte a API pro local e rode o script:
SOLANA_RPC_URL=http://localhost:8899 pnpm --filter @kolibri/api dev &
pnpm --filter @kolibri/api exec tsx scripts/e2e.ts
# → SIWS → registra planta → ancora (Pendente→Publicado) → passaporte → sha256 ok 3/3 → ✅ E2E OK
```

---

## Deploy do contrato na devnet (para o demo público)

O contrato é cluster-agnóstico; falta só financiar a wallet de deploy (o faucet CLI tem rate-limit).

```bash
# 1. Financie a wallet de deploy/serviço (≈2 SOL) via web faucet:
#    https://faucet.solana.com  →  CNxuU4hTR8yyqmKb24KKpsYbtiiV51zZ5kopTmxyvHuo

# 2. Um comando: deploya na devnet + aponta API/web pra devnet
pnpm deploy:devnet
#    (checa o saldo antes; se faltar, para com instrução. Depois é só: pnpm dev)
```

Manual (equivalente): `pnpm anchor:deploy` e então trocar `SOLANA_RPC_URL` (apps/api/.env) e `VITE_SOLANA_RPC_URL` (apps/web/.env) para `https://api.devnet.solana.com`.

Na devnet o **NFT Metaplex Core** é mintado de verdade (o programa Core já está lá), aparece na wallet/explorer, e os links do Explorer + "Verificar on-chain" funcionam.

### Verificação no explorador público (requisito do hackathon)

O equivalente Solana ao Etherscan/Polygonscan é o **Solana Explorer** (explorer.solana.com) e o **Solscan** (solscan.io) — ambos suportam **devnet** (assim como o "Sepolia Etherscan", que é testnet, é aceito pelo edital).

**Nível 1 — deployado e visível:** após `pnpm anchor:deploy`, o programa fica público em:
`https://explorer.solana.com/address/Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF?cluster=devnet`

**Nível 2 — "Verified build"** (equivalente à verificação de código-fonte do Etherscan: prova que o bytecode on-chain bate com o fonte). Com o repo já público no GitHub:

```bash
cargo install solana-verify
# build reproduzível (Docker) do workspace Anchor (que fica em programs/)
solana-verify build --library-name kolibri_registry --mount-path programs
# publica o PDA de verificação apontando pro repo
solana-verify verify-from-repo \
  --mount-path programs \
  --library-name kolibri_registry \
  --program-id Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF \
  -u https://api.devnet.solana.com \
  https://github.com/<usuario>/<repo>
```

> Pré-requisitos do Nível 2: Docker + repo público no GitHub. `--mount-path programs` aponta o tool pro workspace Cargo/Anchor (que mora em `programs/`, fora do pnpm).

---

## Fluxo do produto

1. **Login** — "Entrar com Solana" (SIWS one-click via wallet-adapter).
2. **Dashboard** — métricas + grid de plantas com selo Pendente/Publicado (polling a cada 5s).
3. **Nova planta** — registra a origem (planta-mãe / semente) → vira `Batch` PDA + NFT.
4. **Detalhe** — registra eventos do ciclo (colheita, COA, embalagem, dispensação…); cada um ancora um hash.
5. **Passaporte público** (`/passport/:id`, alvo do QR) — cartão DPP + gauges + selos + abas + NFT + **Verificar on-chain** (recomputa sha256 no navegador e confere a conta `Batch`).

Os **15 tipos de evento** e seus schemas estão em [`docs/event-schemas.md`](./docs/event-schemas.md) (a fonte canônica, espelhada em `@kolibri/types`).

---

## Decisões & escopo

- **Server-custody** na ancoragem (UX de demo + confiabilidade); identidade via SIWS + NFT.
- **NFT mintado pela API (umi)** + vinculado on-chain por `set_asset` — robusto, sem CPI Rust frágil.
- **Sem Cloak** (é só mainnet, dinheiro real) e **sem Chainlink** (foco na história Solana). Privacidade é via PII-como-hash.
- **Anchor 0.32.1** (0.30.1 quebra com Rust/proc-macro2 modernos).
- Storage de uploads é local no MVP; IPFS/Shadow são evolução.

## Status

| Componente | Estado |
|---|---|
| Programa `kolibri_registry` | ✅ build + 5/5 testes + deploy local + ancoragem E2E |
| API (SIWS, CRUD, worker, passaporte, verify) | ✅ E2E validado (sha256 confere 3/3) |
| Web (login, dashboard, forms, passaporte DPP) | ✅ builda + renderiza com dados reais |
| NFT Metaplex Core | ✅ código pronto — minta na devnet |
| Deploy devnet | ⏳ aguardando financiar a wallet (faucet) |

> **Legado:** `HANDOFF.md` e `docs/MOBILE.md` descrevem a arquitetura mobile/gateway anterior ao pivô — mantidos só como referência histórica. A arquitetura atual é a deste README.
