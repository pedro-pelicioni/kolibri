// =====================================================================
// Solana Mobile Wallet Adapter (MWA) — Seeker integration stub
// =====================================================================
//
// On the Solana Seeker, signing flows through the on-device Seed Vault via
// the Mobile Wallet Adapter. No private key ever leaves the secure element,
// and biometric confirmation is enforced by the OS.
//
// This file is a *stub* — wired against the real @solana-mobile/* SDK calls
// so it lights up the moment the dependency is installed. Until then, the
// connect() function returns a deterministic mock so the demo screens render
// without a real wallet present.
//
// Install (Pedro, day 1):
//   yarn add \
//     @solana-mobile/mobile-wallet-adapter-protocol \
//     @solana-mobile/mobile-wallet-adapter-protocol-web3js \
//     @solana/web3.js \
//     react-native-get-random-values \
//     buffer
//
// Then delete the `if (USE_STUB)` branch in connectWallet() and you're live.
// =====================================================================

// NOTE: imports kept as `import type` so this file compiles even before the
// SDK is installed. Replace with real value imports once you `yarn add`.
import type {
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

export type Cluster = 'mainnet-beta' | 'devnet' | 'testnet';

export interface WalletSession {
  /** Base58 public key — used as the SIWS identity and on-chain authority */
  publicKey: string;
  /** Human label resolved from agent-registry (cultivator/dispensary/lab/auditor) */
  label?: string;
  /** Wallet provider name surfaced by MWA (e.g. "Phantom", "Solflare", "Seed Vault") */
  walletName: string;
  /** Cluster we authorised against */
  cluster: Cluster;
  /** Auth token returned by `wallet.authorize` — reuse for silent reconnect */
  authToken: string;
}

const APP_IDENTITY = {
  name: 'Kolibri',
  uri: 'https://dpo2u.com/kolibri',
  icon: 'favicon.ico',
} as const;

// Flip to `false` once @solana-mobile/* is installed and you're testing on a
// real Seeker (or Android emulator with the fakewallet companion app).
const USE_STUB = true;

/**
 * Connect to the user's Solana Mobile wallet (Seed Vault on Seeker).
 *
 * Production flow:
 *   1. `transact(...)` opens the wallet companion app via Android intent
 *   2. `wallet.authorize` returns an auth_token + the user's selected account
 *   3. We hand the pubkey to the kolibri-gateway SIWS challenge endpoint
 *
 * The actual signing of the SIWS message + on-chain transactions is done by
 * `signMessageWithWallet()` and `signAndSubmitEvent()` below.
 */
export async function connectWallet(
  cluster: Cluster = 'devnet',
): Promise<WalletSession> {
  if (USE_STUB) {
    // Mocked session — lets us demo the UI without an APK install
    return {
      publicKey: '8h4nE9dG2pQuYxJrTfX1aZ7kVbW3sLcPmDnQyB5RhKv6',
      walletName: 'Seed Vault (Seeker)',
      label: 'cultivator:42318911000104',
      cluster,
      authToken: 'mwa-mock-auth-token',
    };
  }

  // === Real MWA flow (uncomment after `yarn add`) ===========================
  //
  // const { transact } =
  //   require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
  // const { PublicKey } = require('@solana/web3.js');
  //
  // return transact(async (wallet: Web3MobileWallet) => {
  //   const auth = await wallet.authorize({
  //     cluster,
  //     identity: APP_IDENTITY,
  //   });
  //   const acct = auth.accounts[0];
  //   return {
  //     publicKey: new PublicKey(acct.address).toBase58(),
  //     walletName: auth.wallet_uri_base ?? 'MWA Wallet',
  //     label: acct.label,
  //     cluster,
  //     authToken: auth.auth_token,
  //   };
  // });
  // ==========================================================================

  // Keeps TypeScript happy while USE_STUB === true
  throw new Error('MWA not implemented — set USE_STUB = false after install');
}

/**
 * Sign an arbitrary UTF-8 payload via MWA (used for the SIWS challenge).
 * Returns the signature as base64.
 */
export async function signMessageWithWallet(
  _session: WalletSession,
  _message: string,
): Promise<string> {
  if (USE_STUB) return 'BASE64_MOCK_SIGNATURE==';

  // const { transact } =
  //   require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
  // const { Buffer } = require('buffer');
  //
  // const signed = await transact(async (wallet: Web3MobileWallet) => {
  //   const out = await wallet.signMessages({
  //     addresses: [session.publicKey],
  //     payloads: [Buffer.from(message, 'utf8')],
  //   });
  //   return out[0];
  // });
  // return Buffer.from(signed).toString('base64');

  throw new Error('MWA not implemented');
}

/**
 * Sign + submit a `cannabis-event` transaction prepared by the gateway.
 * Matches the 3-step flow documented in docs/MOBILE.md:
 *
 *   1. App  → gateway  POST /tx/build/cannabis-event   (gets unsigned tx)
 *   2. App  → MWA      signTransactions                (Seed Vault prompt)
 *   3. App  → gateway  POST /tx/submit                 (broadcast + persist)
 */
export async function signAndSubmitEvent(
  _session: WalletSession,
  _unsignedTxBase64: string,
): Promise<string> {
  if (USE_STUB) {
    // Pretend we got a confirmed sig back
    return '5xR2YpKsHaQ9LbVcZmJ7nT3fW4dE1uG6jBoPiNvMqApRzXcKtUwYlSeFhDgRmJ9LnPpTuQwXyAaCbDcEfGh9pL';
  }

  // const { transact } =
  //   require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
  // const { Transaction } = require('@solana/web3.js');
  // const { Buffer } = require('buffer');
  //
  // const tx = Transaction.from(Buffer.from(unsignedTxBase64, 'base64'));
  // const signed = await transact(async (wallet: Web3MobileWallet) => {
  //   const result = await wallet.signTransactions({ transactions: [tx] });
  //   return result[0];
  // });
  // return Buffer.from(signed.serialize()).toString('base64');

  throw new Error('MWA not implemented');
}

// Cosmetic helper — turn a base58 sig into the short form printed everywhere.
export function truncateSignature(sig: string, head = 5, tail = 4): string {
  if (sig.length <= head + tail + 3) return sig;
  return `${sig.slice(0, head)}…${sig.slice(-tail)}`;
}

export const _internal = { APP_IDENTITY, USE_STUB };
// Used as a side-effect import target for `Web3MobileWallet` typing
export type { Web3MobileWallet };
