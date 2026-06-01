import { create, mplCore } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity, publicKey as umiPublicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { env } from "../env.js";
import { serviceKeypair } from "./solana.js";

type Umi = ReturnType<typeof createUmi>;
let _umi: Umi | null = null;

function umi(): Umi {
  if (_umi) return _umi;
  const u = createUmi(env.SOLANA_RPC_URL).use(mplCore());
  const umiKp = u.eddsa.createKeypairFromSecretKey(serviceKeypair().secretKey);
  u.use(keypairIdentity(umiKp));
  _umi = u;
  return u;
}

/**
 * Minta um NFT Metaplex Core (o "certificado" da planta), dono = wallet do dispensário,
 * uri = JSON de metadata servido pela API (aponta pro passaporte). Retorna o endereço do asset.
 */
export async function mintPassportNft(params: {
  name: string;
  uri: string;
  owner: string;
}): Promise<string> {
  const u = umi();
  const asset = generateSigner(u);
  await create(u, {
    asset,
    name: params.name,
    uri: params.uri,
    owner: umiPublicKey(params.owner),
  }).sendAndConfirm(u);
  return asset.publicKey.toString();
}
