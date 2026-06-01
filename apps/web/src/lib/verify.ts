import { fetchBatch, getReadonlyProgram, sha256Hex } from "@kolibri/sdk";
import type { VerifyDataDTO } from "@kolibri/types";
import { Connection, PublicKey } from "@solana/web3.js";

export interface VerifyResult {
  ok: boolean;
  total: number;
  matched: number;
  onChainFound: boolean;
  lastHashMatches: boolean | null;
  perEvent: Array<{ index: number; recomputed: string; expected: string; match: boolean }>;
}

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifica o passaporte:
 *  1) recomputa sha256(canonicalJson) de cada evento e compara com o payload_hash;
 *  2) lê a conta Batch on-chain e confere existência + hash do último evento ancorado.
 */
export async function verifyPassport(data: VerifyDataDTO): Promise<VerifyResult> {
  const perEvent = data.events.map((e) => {
    const recomputed = sha256Hex(e.canonicalJson);
    return {
      index: e.index,
      recomputed,
      expected: e.payloadHash,
      match: recomputed === e.payloadHash,
    };
  });
  const matched = perEvent.filter((p) => p.match).length;

  let onChainFound = false;
  let lastHashMatches: boolean | null = null;
  try {
    if (data.pda) {
      const conn = new Connection(import.meta.env.VITE_SOLANA_RPC_URL, "confirmed");
      const program = getReadonlyProgram(conn);
      const batch = await fetchBatch(program, new PublicKey(data.pda));
      if (batch) {
        onChainFound = true;
        const onChainLast = bytesToHex(batch.lastEventHash);
        const anchored = data.events.filter((e) => e.txSig);
        const lastAnchored = anchored[anchored.length - 1];
        lastHashMatches = lastAnchored ? onChainLast === lastAnchored.payloadHash : null;
      }
    }
  } catch {
    // erros de RPC não invalidam a verificação off-chain
  }

  const ok = perEvent.length > 0 && matched === perEvent.length && onChainFound;
  return { ok, total: perEvent.length, matched, onChainFound, lastHashMatches, perEvent };
}
