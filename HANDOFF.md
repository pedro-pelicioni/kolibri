# Kolibri × DPO2U — Day-0 Handoff (Pedro)

Tudo o que você precisa pra começar o app mobile do Kolibri no Solana Seeker.

**TL;DR**: backend pronto e validado E2E em produção (`https://dpo2u.com/kolibri`). Programa Solana shipped em devnet (selector 0x06). SDK npm-ready. Compliance MCP rodando. Suas únicas responsabilidades são o app RN + UX. Tudo open, sem licença/revenue.

---

## Status (2026-05-27, 22:20 UTC)

| Componente | Status | Evidência |
|---|---|---|
| Programa Solana (selector 0x06) | LIVE devnet | `FZ21S53Rn8Y6ANfccS2waCrkYWh5zfjXK3hkKU5YSkJ8` slot 465347314 |
| `@dpo2u/client-sdk` cannabis module | shipped | 11/11 unit tests + IDLs vendorados |
| Programa tests | 8/8 passing | bankrun cobertura PDA+role+idempotency+15 event types |
| Backend `kolibri-gateway` | LIVE production | `https://dpo2u.com/kolibri/health` → `200 {ok:true}` |
| Postgres | running | 7 tabelas (events + batches + recalls + 4 gateway_*) |
| OpenAPI 3.0.3 spec | publicado | `https://dpo2u.com/kolibri/openapi.json` (20 routes) |
| Gateway tests | 19/19 passing | siws + jwt + canonical-json + ulid |
| E2E smoke | passou produção+devnet | tx [`vbvno2gb…STCi`](https://solscan.io/tx/vbvno2gb74XAGuUjhJW6xEpAJ8JBT51QvnHZZZShMbMRnZEJegL5bLRwCnC1ytcRkQu2AkcJYthz8WSGhh6STCi?cluster=devnet) |
| Reconciliation worker | shipped | Node TS, polls + anchors via SDK |
| Sample app + register-agent CLI | shipped | `kolibri-integration/sample/` |
| MOBILE.md handoff | shipped | esta pasta |

---

## URLs canônicas

```
Gateway base:    https://dpo2u.com/kolibri
OpenAPI spec:    https://dpo2u.com/kolibri/openapi.json
Health probe:    https://dpo2u.com/kolibri/health
Program ID:      FZ21S53Rn8Y6ANfccS2waCrkYWh5zfjXK3hkKU5YSkJ8 (devnet + mainnet)
Agent Registry:  5qeuUAaJi9kTzsfmiphQ89PNrpqy7xW7sCvhBZQ6mya7
MCP:             https://mcp.dpo2u.com
```

---

## Sua primeira semana (S0 — 1 sprint)

### Dia 1 — scaffold + tipos

```bash
# 1. Inicia o repo
git init pedro-pelicioni/kolibri  # se ainda vazio; ou já clonou
cd kolibri
npx react-native@latest init KolibriApp --template react-native-template-typescript
cd KolibriApp

# 2. Instala Solana Mobile RN SDK + deps básicas
yarn add @solana-mobile/mobile-wallet-adapter-protocol \
         @solana-mobile/mobile-wallet-adapter-protocol-web3js \
         @solana/web3.js \
         react-native-get-random-values \
         react-native-camera \
         react-native-camera-kit \
         buffer

# 3. Gera os tipos da API a partir do nosso OpenAPI
yarn add -D openapi-typescript
npx openapi-typescript https://dpo2u.com/kolibri/openapi.json -o src/api.d.ts

# 4. Confere — vai criar 20 endpoints tipados, com bodies/responses estritos
grep -c "operations\[" src/api.d.ts  # esperado: ~20
```

### Dia 2 — Cliente HTTP + tela de login SIWS

Crie `src/api/client.ts`:

```ts
import type { paths } from '../api.d';

const BASE = 'https://dpo2u.com/kolibri';
let accessToken: string | null = null;

export function setAccessToken(t: string) { accessToken = t; }
export function clearAccessToken() { accessToken = null; }

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${path} → ${res.status}: ${err}`);
  }
  return res.json();
}
```

Tela de login (`src/screens/LoginScreen.tsx`) — fluxo SIWS:

```tsx
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { api, setAccessToken } from '../api/client';

export async function loginWithSeekerWallet() {
  return transact(async (wallet) => {
    const auth = await wallet.authorize({
      cluster: 'devnet',
      identity: { name: 'Kolibri' },
    });
    const pubkey = new PublicKey(auth.accounts[0].address);

    const challenge = await api<any>('/auth/siws/challenge', {
      method: 'POST',
      body: JSON.stringify({ pubkey: pubkey.toBase58() }),
    });

    const signed = await wallet.signMessages({
      addresses: [pubkey.toBase58()],
      payloads: [Buffer.from(challenge.message, 'utf8')],
    });

    const verify = await api<any>('/auth/siws/verify', {
      method: 'POST',
      body: JSON.stringify({
        pubkey: pubkey.toBase58(),
        nonce: challenge.nonce,
        signature: Buffer.from(signed[0]).toString('base64'),
        role: 'cultivator',
        agent_name: `cultivator:${userCnpj}`, // o CNPJ do cultivador logado
      }),
    });
    setAccessToken(verify.access_token);
    return verify;
  });
}
```

### Dia 3 — primeira tela funcional ("Nova planta-mãe")

```tsx
import { Transaction } from '@solana/web3.js';
import { ulid } from 'ulid';
import { Buffer } from 'buffer';

async function registerMother(form: {
  cultivarFull: string;
  genotype: string;
  notes: string;
  cnpj: string;
}) {
  const batchUlid = ulid();

  // 1. Cria batch off-chain
  await api('/batches', {
    method: 'POST',
    body: JSON.stringify({
      cultivar_code: 'HEM:CBD1',  // 8 chars máx — código curto do cultivar
      origin_event_type: 2,        // MOTHER_REGISTERED
    }),
  });

  // 2. Pede unsigned tx ao gateway (gateway canonicaliza payload + upload Shadow + builds tx)
  const built = await api<any>('/tx/build/cannabis-event', {
    method: 'POST',
    body: JSON.stringify({
      batch_id: batchUlid,
      event_type: 2,
      cultivar_code: 'HEM:CBD1',
      agent_name: `cultivator:${form.cnpj}`,
      payload: {
        evt: 'MOTHER_REGISTERED',
        schema_v: 1,
        cultivar_full: form.cultivarFull,
        genotype: form.genotype,
        notes: form.notes,
        ts: Math.floor(Date.now() / 1000),
      },
    }),
  });

  // 3. Assina via MWA (Seed Vault, biometria)
  const tx = Transaction.from(Buffer.from(built.tx_bytes_b64, 'base64'));
  const signed = await transact(async (wallet) => {
    const result = await wallet.signTransactions({ transactions: [tx] });
    return result[0];
  });

  // 4. Submete signed tx → gateway broadcast + persist
  const out = await api<any>('/tx/submit', {
    method: 'POST',
    body: JSON.stringify({
      event_id: built.event_id,
      signed_tx_b64: signed.serialize().toString('base64'),
    }),
  });

  return out; // { signature, slot, pda, explorer_url }
}
```

### Dia 4-5 — câmera + upload de foto

```tsx
import { CameraScreen } from 'react-native-camera-kit';

async function uploadPhoto(uri: string) {
  const form = new FormData();
  form.append('file', { uri, type: 'image/jpeg', name: 'plant.jpg' } as any);
  const res = await fetch(`https://dpo2u.com/kolibri/upload/photo`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}` },
    body: form as any,
  });
  return res.json(); // { storage_uri, sha256_hex, bytes, content_type }
}
```

A `storage_uri` retornada já pode ir no payload do próximo evento.

---

## Os 15 tipos de evento (cheat sheet)

| Code | Type | Role | Quando |
|---|---|---|---|
| 1 | SEED_PLANTED | cultivator | Plantio de semente |
| 2 | MOTHER_REGISTERED | cultivator | Registra planta-mãe |
| 3 | CLONE_CUT | cultivator | Corta clones de uma mãe |
| 4 | VEGETATION_START | cultivator | Início fase vegetativa |
| 5 | FLOWERING_START | cultivator | Início fase de floração |
| 6 | HARVEST | cultivator | Colheita |
| 7 | DRYING_START | cultivator | Início secagem |
| 8 | CURING_START | cultivator | Início cura |
| 9 | LAB_SAMPLE_TAKEN | cultivator/lab | Amostra retirada pra análise |
| 10 | LAB_RESULT_RELEASED | lab | COA assinado pelo lab |
| 11 | PACKAGED | cultivator | Lote embalado em unidades |
| 12 | TRANSFERRED | cultivator/dispensary | Movimento cultivador→dispensário |
| 13 | DISPENSED | dispensary | Venda ao paciente (com hash, sem PII) |
| 14 | RECALLED | cultivator/dispensary/admin | Recall (preventivo ou ANVISA) |
| 15 | DESTROYED | cultivator/admin | Descarte por defeito/contaminação |

Schemas JSON detalhados de cada payload em `docs/event-schemas.md`.

---

## Como o gateway protege os dados

| Camada | O que faz |
|---|---|
| TLS 1.3 (Traefik + LetsEncrypt) | Tudo em HTTPS |
| SIWS challenge nonce | Single-use, 5min TTL |
| JWT HS256 | Access 15min + refresh 7d, role-gated |
| Log redaction | Tokens, bodies sensíveis → `[REDACTED]` no pino |
| Rate limit | 600 req/min/wallet (configurável) |
| Helmet headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` |
| PII gate | DDL constraint `chk_no_pii_anchored` — eventos com PII nunca são anchored on-chain |
| Cross-program agent-registry | Authority precisa estar pré-registrada (cultivador/dispensário/lab) |
| Canonical JSON (JCS-style) | Hash determinístico — auditor recomputa e verifica integridade |
| Shadow Drive (S2) | Payload imutável; pode cifrar client-side antes de subir |

---

## Comandos curl (debugging local)

```bash
# Health
curl https://dpo2u.com/kolibri/health

# OpenAPI spec
curl https://dpo2u.com/kolibri/openapi.json | jq '.paths | keys'

# SIWS challenge (requer wallet pubkey)
curl -X POST https://dpo2u.com/kolibri/auth/siws/challenge \
  -H 'content-type: application/json' \
  -d '{"pubkey":"YOUR_PUBKEY"}'

# Tudo daí pra frente exige JWT obtido via /auth/siws/verify
```

Script E2E completo de referência: `/root/DPO2U/packages/kolibri-gateway/scripts/e2e-smoke.mjs`. Reproduz o fluxo todo simulando o MWA com um keypair JSON local.

---

## Roadmap proposto (15 semanas)

| Sprint | Mobile (Pedro) | Backend (DPO2U) | Entrega visível |
|---|---|---|---|
| **S0** (1 sem) | RN init + tipos OpenAPI + login SIWS | gateway já live ✓ | "Login com wallet" funcionando |
| **S1** (3 sem) | Telas mother/clone/vegetação/floração + fotos | shadow drive real upload (S2 antes) | Cultivo completo on devnet |
| **S2** (3 sem) | Colheita + secagem + cura + COA upload | Shadow drive real ✓ | Lote completo com COA anchored |
| **S3** (3 sem) | Packaging + QR codes + dispensação + scanner | QR-gen endpoint | Venda piloto E2E |
| **S4** (3 sem) | Admin compliance + auditor view | Audit PDF assinado + SNGPC XML | Audit trail real |
| **S5** (2 sem) | Beta com piloto + dApp Store submit | Mainnet deploy gateway + program | Go-live |

---

## Quando você travar

1. **Erro do gateway** — logs em `docker logs kolibri-gateway` (Chairman acessa)
2. **Erro do programa Solana** — `solana logs FZ21S53R... --url devnet` ou Solscan tx page
3. **Erro de auth** — chequa que o agent_name está pré-registrado em agent-registry (use `register-agent.ts` em `kolibri-integration/sample/`)
4. **Erro de payload** — schema JSON em `docs/event-schemas.md`; valida com o canonical-json do gateway

WhatsApp do Chairman: (você já tem)  
GitHub issue: https://github.com/fredericosanntana/dpo2u-solana/issues

---

## O que DPO2U não vai fazer

- UI / UX / design do app (escopo Pedro)
- Telas de cultivador / dispensário / lab (escopo Pedro)
- Onboarding de cultivadores reais (escopo Pedro / cliente)
- Submissão dApp Store (escopo Pedro)
- Push notifications (Solana Mobile push — sprint S5)

Tudo o resto, é nosso. Bom build.

— Frederico Santana (Chairman, DPO2U)
