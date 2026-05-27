# Kolibri Mobile (Seeker) — DPO2U Gateway Integration

Handoff doc para Pedro Pelicioni — app React Native no Solana Seeker consome o `kolibri-gateway` HTTP que a DPO2U entrega open.

## Topologia

```
React Native App (Solana Seeker / Android)
   │
   │  HTTPS + Bearer JWT
   ▼
kolibri-gateway (Fastify + TypeScript)
   │
   ├─→ Postgres (traceability_events + batches + recalls + gateway_*)
   ├─→ @dpo2u/client-sdk → Solana devnet/mainnet (selector 0x06)
   ├─→ Shadow Drive (server keypair, immutable payloads)
   └─→ mcp.dpo2u.com (compliance relay)
```

## O que a DPO2U entrega (`packages/kolibri-gateway`)

| Arquivo | Conteúdo |
|---|---|
| `package.json` | Fastify 4 + zod + pg + tweetnacl + @fastify/swagger + @dpo2u/client-sdk |
| `migrations/002_gateway_tables.sql` | Tabelas auxiliares: gateway_tenants, gateway_wallets, gateway_uploads, gateway_pending_txs |
| `src/auth/siws.ts` | Sign-In With Solana — challenge/verify ed25519 + nonce single-use |
| `src/auth/jwt.ts` | HS256 issue/verify (access 15min + refresh 7d) |
| `src/auth/middleware.ts` | requireAuth + requireRole |
| `src/services/postgres.service.ts` | Pool + helpers tipados |
| `src/services/solana.service.ts` | Wraps client-sdk: buildCannabisEventTx, submitSignedTx, resolveAgentFromRegistry |
| `src/services/shadow.service.ts` | Upload Shadow Drive (server keypair); fallback local file:// pra dev |
| `src/services/mcp.service.ts` | Cliente HTTP pra MCP DPO2U (DPIA, score, compliance) |
| `src/routes/` | 20 endpoints OpenAPI'd |
| `src/lib/canonical-json.ts` | JCS-like canonical JSON + sha256 |
| `src/lib/ulid.ts` | ULID ↔ 16-byte buffer roundtrip |
| `openapi.json` | Spec 3.0.3 (auto-gen via `pnpm build:openapi`) |

## Endpoints (20 total)

| Rota | Auth | Quem chama |
|---|---|---|
| `POST /auth/siws/challenge` | público | App pra iniciar login |
| `POST /auth/siws/verify` | público | App após MWA assinar |
| `POST /auth/refresh` | refresh token | App quando JWT expirar |
| `GET /batches` | JWT | App home — lista batches |
| `POST /batches` | JWT cultivador | App "novo lote" |
| `GET /batches/:id` | JWT | App detalhes do batch |
| `GET /batches/:id/events` | JWT | App linha do tempo |
| `POST /events` | JWT + role | Server-anchor path (fallback) |
| `GET /events/:event_id` | JWT | App leitura por id |
| `GET /events/by-pda/:pda` | JWT | App verify on-chain link |
| `POST /tx/build/cannabis-event` | JWT + role | App **MWA flow passo 1** |
| `POST /tx/submit` | JWT | App **MWA flow passo 3** |
| `POST /upload/photo` | JWT | App câmera capture |
| `POST /upload/payload` | JWT | App JSON-only upload |
| `GET /compliance/dpia` | JWT admin | App admin "rodar DPIA" |
| `GET /compliance/score` | JWT admin | App admin dashboard |
| `GET /compliance/check` | JWT admin | App admin gap check |
| `POST /compliance/recall` | JWT cultivador/dispensário/admin | App "abrir recall" |
| `GET /audit/batch/:id` | JWT auditor/admin/role | Auditor ANVISA (read-only) |
| `GET /audit/sngpc/:date` | JWT admin | Export diário SNGPC (S4) |
| `GET /health` | público | Liveness probe |

## Setup do app Pedro

### 1. Instalar Solana Mobile RN SDK

```bash
npx react-native init KolibriApp
cd KolibriApp
yarn add \
  @solana-mobile/mobile-wallet-adapter-protocol \
  @solana-mobile/mobile-wallet-adapter-protocol-web3js \
  @solana/web3.js \
  react-native-get-random-values \
  buffer
```

### 2. Gerar tipos da API a partir do OpenAPI

```bash
yarn add -D openapi-typescript
npx openapi-typescript https://kolibri-gateway.dev.dpo2u.com/openapi.json -o src/api.d.ts
```

Resultado: tipos 100% sincronizados com o gateway. Sem RPC, sem manual drift.

### 3. Cliente HTTP tipado

```ts
// src/api/client.ts
import type { paths } from '../api.d';

const BASE = 'https://kolibri-gateway.dev.dpo2u.com';

let accessToken: string | null = null;

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

export function setAccessToken(token: string) { accessToken = token; }
```

## Fluxo SIWS (login)

```ts
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey } from '@solana/web3.js';

async function loginWithMWA() {
  return transact(async (wallet: Web3MobileWallet) => {
    // 1. Authorize wallet (one-time per app session)
    const auth = await wallet.authorize({
      cluster: 'devnet',
      identity: { name: 'Kolibri' },
    });
    const pubkey = new PublicKey(auth.accounts[0].address);

    // 2. Get challenge from gateway
    const challenge = await api<any>('/auth/siws/challenge', {
      method: 'POST',
      body: JSON.stringify({ pubkey: pubkey.toBase58() }),
    });

    // 3. Sign the canonical message via MWA
    const signed = await wallet.signMessages({
      addresses: [pubkey.toBase58()],
      payloads: [Buffer.from(challenge.message, 'utf8')],
    });
    const signature_b64 = Buffer.from(signed[0]).toString('base64');

    // 4. Verify → JWT
    const verify = await api<any>('/auth/siws/verify', {
      method: 'POST',
      body: JSON.stringify({
        pubkey: pubkey.toBase58(),
        nonce: challenge.nonce,
        signature: signature_b64,
        agent_name: `cultivator:${cnpjOfUser}`, // optional but recommended
      }),
    });
    setAccessToken(verify.access_token);
    return verify;
  });
}
```

## Fluxo MWA anchor (3-pass)

```ts
import { Transaction } from '@solana/web3.js';

async function registerMother(form: MotherForm) {
  const payload = {
    evt: 'MOTHER_REGISTERED',
    schema_v: 1,
    cultivar_full: form.cultivar,
    genotype: form.genotype,
    phenotype_notes: form.notes,
    photos: form.photoUris, // pode passar URIs locais e depois subir via /upload/photo
    ts: Math.floor(Date.now() / 1000),
  };

  // 1. Build unsigned tx
  const built = await api<any>('/tx/build/cannabis-event', {
    method: 'POST',
    body: JSON.stringify({
      batch_id: form.batchUlid,
      event_type: 2, // MOTHER_REGISTERED
      cultivar_code: form.cultivarCode, // ≤8 chars
      agent_name: form.agentName,
      payload,
    }),
  });

  // 2. Sign via MWA
  const txBytes = Buffer.from(built.tx_bytes_b64, 'base64');
  const tx = Transaction.from(txBytes);
  const signed = await transact(async (wallet) => {
    const result = await wallet.signTransactions({ transactions: [tx] });
    return result[0];
  });

  // 3. Submit signed tx
  const out = await api<any>('/tx/submit', {
    method: 'POST',
    body: JSON.stringify({
      event_id: built.event_id,
      signed_tx_b64: signed.serialize().toString('base64'),
    }),
  });

  return { eventPda: out.pda, signature: out.signature, explorer: out.explorer_url };
}
```

## Upload de foto

```ts
async function uploadPhoto(uri: string, mimetype = 'image/jpeg') {
  const form = new FormData();
  form.append('file', { uri, type: mimetype, name: 'photo.jpg' } as any);
  const res = await fetch(`${BASE}/upload/photo`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}` },
    body: form as any,
  });
  return res.json(); // { storage_uri, sha256_hex, bytes, content_type }
}
```

## Telas mínimas (proposta MVP)

| Sprint | Telas |
|---|---|
| **S0** | Login SIWS (botão "Sign in with Solana Wallet") |
| **S1 Cultivo** | Home + lista de batches + "Nova planta-mãe" (form + fotos) + "Cortar clones" |
| **S2 Colheita+Lab** | Detalhe do lote + colheita (peso, fotos) + secagem + cura + "Enviar amostra ao lab" + "Upload COA PDF" |
| **S3 Embalagem+Dispensação** | "Embalar lote" + gerar QR codes + dispensação (escanear QR + paciente hash) |
| **S4 Compliance+SNGPC** | Admin "rodar DPIA" + dashboard de score + abrir recall + auditor view |
| **S5 Dry-run mainnet** | Beta gate + dApp Store submit + push notifications |

## Matriz de responsabilidade

| Responsabilidade | DPO2U | Pedro |
|---|---|---|
| Programas Solana | ✓ | |
| SDK TypeScript | ✓ | |
| Postgres migrations | ✓ | |
| Gateway HTTP (Fastify) | ✓ | |
| Auth SIWS + JWT | ✓ | |
| Shadow Drive server upload | ✓ | |
| MCP compliance relay | ✓ | |
| Reconciliation worker | ✓ | |
| OpenAPI spec | ✓ | |
| DPA LGPD modelo | ✓ | |
| App React Native | | ✓ |
| Telas + forms | | ✓ |
| Câmera + QR scanner | | ✓ |
| Integração MWA RN SDK | | ✓ |
| UX/UI design | | ✓ |
| Submissão dApp Store | | ✓ |
| Push notifications | | ✓ (Solana Mobile push) |
| Onboarding cultivadores reais | | ✓ |

## Como o Pedro arranca

### Local dev

```bash
# 1. Clonar DPO2U
git clone https://github.com/fredericosanntana/DPO2U
cd DPO2U/packages/kolibri-gateway

# 2. Aplicar migrations no Postgres
psql "$DATABASE_URL" < ../../02-Projects/active/kolibri-integration/migrations/001_traceability_events.sql
psql "$DATABASE_URL" < migrations/002_gateway_tables.sql

# 3. Configurar env
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET (≥32 chars), ANCHOR_AUTHORITY_KEYPAIR

# 4. Boot
pnpm install
pnpm dev
# → http://localhost:8090
# → http://localhost:8090/openapi.json ← Pedro consome aqui

# 5. Gerar tipos no app dele
cd ~/dev/KolibriApp
npx openapi-typescript http://localhost:8090/openapi.json -o src/api.d.ts
```

### Devnet test

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com \
DATABASE_URL=postgres://kolibri:kolibri@localhost/kolibri_dev \
JWT_SECRET=$(openssl rand -hex 32) \
ANCHOR_AUTHORITY_KEYPAIR=~/.config/solana/id.json \
pnpm start
```

App aponta pra http://<server-ip>:8090 — fluxo completo SIWS → MWA → anchor → consulta.

## Status

- **Backend**: shipped + tested + 20 endpoints OpenAPI documentados
- **Tests**: 19/19 verde (siws, jwt, canonical-json, ulid)
- **OpenAPI**: gerado em `openapi.json` (837 linhas) — pronto pra openapi-typescript no app
- **Próximo passo DPO2U**: deploy do gateway em devnet (`https://kolibri-gateway.dev.dpo2u.com`) — aguardando ack do Chairman
- **Próximo passo Pedro**: `npx react-native init` + gerar tipos + tela login SIWS

## Limitações conscientes do MVP

1. **Shadow Drive upload em local-fallback** (`file://`) — produção exige provisionar storage account; sprint S2 substitui
2. **Audit PDF + SNGPC XML** retornam JSON com `TODO_S4` — placeholders OpenAPI estáveis, lógica fica pra S4
3. **Rate limit em memória** (não Redis) — single-instance OK pra piloto; multi-instance precisa Redis store
4. **Nonce SIWS em memória** (não Redis) — idem; piloto 1-instance é OK
5. **Sem WebSocket / push** — App fará polling de `/batches/:id/events` no MVP; push notifications são S5
6. **Sem testes de integração contra Postgres real** — unit tests de auth/jwt/canonical/ulid cobrem o core; integração E2E real exige docker-compose com Postgres + RPC mock (sprint S1)
