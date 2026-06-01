/**
 * E2E: simula o fluxo completo do dispensário sem navegador.
 * SIWS (assina com tweetnacl) → registra planta → observa ancoragem → passaporte → verifica hashes.
 *
 * Rodar com a API e uma chain (validador local ou devnet) no ar:
 *   pnpm --filter @kolibri/api exec tsx scripts/e2e.ts
 */
import { sha256Hex } from "@kolibri/sdk";
import { createSignInMessage } from "@solana/wallet-standard-util";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";

const BASE = process.env.API_BASE ?? "http://localhost:8080";
const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64");
const j = async (r: Response) => {
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
};

async function main() {
  const kp = Keypair.generate();
  const pubkey = kp.publicKey.toBase58();
  console.log("dispensário:", pubkey);

  // 1) challenge
  const { input } = await j(
    await fetch(`${BASE}/auth/siws/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pubkey }),
    }),
  );

  // 2) assina a mensagem SIWS
  const message = createSignInMessage(input);
  const signature = nacl.sign.detached(message, kp.secretKey);
  const output = {
    account: { address: pubkey, publicKey: b64(kp.publicKey.toBytes()) },
    signature: b64(signature),
    signedMessage: b64(message),
    signatureType: "ed25519",
  };

  // 3) verify → JWT
  const verify = await j(
    await fetch(`${BASE}/auth/siws/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input, output }),
    }),
  );
  const auth = { authorization: `Bearer ${verify.accessToken}`, "content-type": "application/json" };
  console.log("✓ autenticado (JWT)");

  // faucet: gift de SOL p/ a wallet conectada (transfer da keypair de serviço)
  const faucet = await j(await fetch(`${BASE}/faucet`, { method: "POST", headers: auth, body: "{}" }));
  console.log(`✓ faucet: funded=${faucet.funded} saldo=${(faucet.balance / 1e9).toFixed(3)} SOL`);

  // 4) registra planta
  const batch = await j(
    await fetch(`${BASE}/plants`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        cultivarCode: "HEM:CBD1",
        originEventType: 2,
        payload: {
          cultivar_full: "Charlotte's Web F2",
          genotype: "70% indica / 30% sativa",
          phenotype_notes: "origem: Sementeira Tech BR",
        },
      }),
    }),
  );
  console.log("✓ planta registrada:", batch.id);

  // 5) eventos: HARVEST + LAB_RESULT_RELEASED
  await j(
    await fetch(`${BASE}/plants/${batch.id}/events`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ eventType: 6, payload: { wet_weight_g: 480, trichome_status: "60% milky" } }),
    }),
  );
  await j(
    await fetch(`${BASE}/plants/${batch.id}/events`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        eventType: 10,
        payload: { coa_uri: "shadow://coa.pdf", coa_hash: "abc123", thc_pct: 0.2, cbd_pct: 8.4, pesticides: "pass" },
      }),
    }),
  );
  console.log("✓ 2 eventos adicionados");

  // 6) observa ancoragem (worker server-custody)
  for (let i = 0; i < 30; i++) {
    const d = await j(await fetch(`${BASE}/plants/${batch.id}`, { headers: auth }));
    const anc = d.events.filter((e: { anchoredAt: string | null }) => e.anchoredAt).length;
    console.log(
      `  poll ${i}: batch.anchoredAt=${!!d.batch.anchor.anchoredAt} pda=${d.batch.anchor.pda ?? "-"} nft=${d.batch.anchor.asset ?? "-"} eventos ancorados=${anc}/${d.events.length}`,
    );
    if (d.batch.anchor.anchoredAt && anc === d.events.length) break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  // 7) passaporte público + verificação de hashes
  const passport = await j(await fetch(`${BASE}/passport/${batch.id}`));
  console.log(
    "✓ passaporte:",
    passport.gauges.map((g: { label: string; value: number }) => `${g.label}=${g.value}%`).join(", "),
  );
  const vd = await j(await fetch(`${BASE}/passport/${batch.id}/verify-data`));
  const matches: boolean[] = vd.events.map(
    (e: { canonicalJson: string; payloadHash: string }) => sha256Hex(e.canonicalJson) === e.payloadHash,
  );
  console.log(`✓ verify-data: pda=${vd.pda} eventos=${vd.events.length} sha256 ok=${matches.filter(Boolean).length}/${matches.length}`);
  console.log(matches.every(Boolean) && vd.pda ? "\n✅ E2E OK" : "\n⚠ E2E incompleto (anchoring pendente?)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
