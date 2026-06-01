import type {
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import { api } from "./api";
import { bytesToB64 } from "./format";

export interface VerifyResult {
  accessToken: string;
  refreshToken: string;
  dispensary: { id: string; walletPubkey: string; name: string | null };
}

/** Fluxo SIWS: challenge → wallet.signIn → verify. Retorna os tokens + dispensário. */
export async function siwsLogin(
  publicKey: string,
  signIn: (input: SolanaSignInInput) => Promise<SolanaSignInOutput>,
): Promise<VerifyResult> {
  const { input } = await api.post<{ input: SolanaSignInInput }>(
    "/auth/siws/challenge",
    {
      pubkey: publicKey,
      domain: window.location.host,
      uri: window.location.origin,
    },
  );

  const output = await signIn(input);

  return api.post<VerifyResult>("/auth/siws/verify", {
    input,
    output: {
      account: {
        address: output.account.address,
        publicKey: bytesToB64(output.account.publicKey),
      },
      signature: bytesToB64(output.signature),
      signedMessage: bytesToB64(output.signedMessage),
      signatureType: output.signatureType ?? "ed25519",
    },
  });
}
