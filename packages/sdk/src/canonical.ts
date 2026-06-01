import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";

/**
 * Canonical JSON (estilo JCS / RFC 8785), portado de docs/event-schemas.md:
 *  - chaves ordenadas alfabeticamente (recursivo)
 *  - sem espaços entre tokens
 *  - números/booleans/null em forma JSON padrão
 *
 * É a ÚNICA fonte de verdade de canonicalização — usada pela API (hash antes de
 * ancorar) e pela Web (recomputar pra verificar). Qualquer divergência quebra a
 * verificação on-chain, então mantenha API e Web importando ESTA função.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + canonicalize(obj[k]))
      .join(",") +
    "}"
  );
}

export function sha256Bytes(input: Uint8Array | string): Uint8Array {
  const bytes = typeof input === "string" ? utf8ToBytes(input) : input;
  return sha256(bytes);
}

export function sha256Hex(input: Uint8Array | string): string {
  return bytesToHex(sha256Bytes(input));
}

export interface CanonicalHash {
  canonical: string;
  hashHex: string;
  hashBytes: Uint8Array;
}

/** Canonicaliza um objeto e devolve o canonical string + sha256 (hex e bytes). */
export function hashCanonical(value: unknown): CanonicalHash {
  const canonical = canonicalize(value);
  const hashBytes = sha256Bytes(canonical);
  return { canonical, hashHex: bytesToHex(hashBytes), hashBytes };
}

export { bytesToHex, hexToBytes } from "@noble/hashes/utils";
