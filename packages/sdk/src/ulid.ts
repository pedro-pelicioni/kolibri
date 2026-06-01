/**
 * ULID ↔ 16 bytes. O `batch_id` é ULID (string) no DB/UI e [u8;16] on-chain (seed do PDA).
 * O round-trip PRECISA bater byte-a-byte senão a derivação do PDA diverge.
 *
 * ULID = 48 bits de timestamp (ms) + 80 bits de aleatoriedade = 128 bits,
 * codificados em 26 chars Crockford base32 (130 bits, 2 bits altos = padding 0).
 */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const DECODE: Record<string, number> = {};
for (let i = 0; i < CROCKFORD.length; i++) DECODE[CROCKFORD[i]!] = i;

function getCrypto(): { getRandomValues: (a: Uint8Array) => Uint8Array } {
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (!c?.getRandomValues) throw new Error("Web Crypto (crypto.getRandomValues) indisponível");
  return c as { getRandomValues: (a: Uint8Array) => Uint8Array };
}

/** Gera um novo ULID (26 chars). Funciona em browser e Node >=20. */
export function newUlid(now: number = Date.now(), randomness?: Uint8Array): string {
  const bytes = new Uint8Array(16);
  let t = BigInt(Math.floor(now));
  for (let i = 5; i >= 0; i--) {
    bytes[i] = Number(t & 0xffn);
    t >>= 8n;
  }
  const rand = randomness ?? getCrypto().getRandomValues(new Uint8Array(10));
  bytes.set(rand.subarray(0, 10), 6);
  return bytesToUlid(bytes);
}

export function ulidToBytes(ulid: string): Uint8Array {
  if (ulid.length !== 26) {
    throw new Error(`ULID inválido: esperado 26 chars, veio ${ulid.length}`);
  }
  let value = 0n;
  for (const ch of ulid.toUpperCase()) {
    const idx = DECODE[ch];
    if (idx === undefined) throw new Error(`Caractere ULID inválido: ${ch}`);
    value = value * 32n + BigInt(idx);
  }
  value &= (1n << 128n) - 1n; // descarta os 2 bits altos de padding
  const out = new Uint8Array(16);
  for (let i = 15; i >= 0; i--) {
    out[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return out;
}

export function bytesToUlid(bytes: Uint8Array): string {
  if (bytes.length !== 16) {
    throw new Error(`Esperado 16 bytes, veio ${bytes.length}`);
  }
  let value = 0n;
  for (const b of bytes) value = (value << 8n) | BigInt(b);
  let out = "";
  for (let i = 0; i < 26; i++) {
    out = CROCKFORD[Number(value & 31n)]! + out;
    value >>= 5n;
  }
  return out;
}
