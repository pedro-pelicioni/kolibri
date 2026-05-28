// =====================================================================
// Solana Mobile Wallet Adapter (MWA) — Seeker integration
// =====================================================================
//
// On the Solana Seeker, signing flows through the on-device Seed Vault via
// the Mobile Wallet Adapter. No private key ever leaves the secure element,
// and biometric confirmation is enforced by the OS.
//
// Flip USE_STUB=false (and run on a Seeker, or on an Android emulator with
// the MWA `fakewallet.apk` installed) to exercise the real Seed Vault flow.
//
// Polyfills (`react-native-get-random-values`, `Buffer`) are wired in
// index.js — required by @solana/web3.js before any of its types are
// touched.
// =====================================================================

import { transact, type Web3MobileWallet } from
  '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

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

// Flip to `false` once you're testing on a real Seeker (or Android emulator
// with the fakewallet companion app installed). Keep `true` to run the demo
// without a wallet present — every function below short-circuits to a mock.
export const USE_STUB = true;

const STUB_SESSION: WalletSession = {
  publicKey: '8h4nE9dG2pQuYxJrTfX1aZ7kVbW3sLcPmDnQyB5RhKv6',
  walletName: 'Seed Vault (Seeker)',
  label: 'cultivator:42318911000104',
  cluster: 'devnet',
  authToken: 'mwa-mock-auth-token',
};

/**
 * Connect to the user's Solana Mobile wallet (Seed Vault on Seeker).
 *
 * Production flow:
 *   1. `transact(...)` opens the wallet companion app via Android intent
 *   2. `wallet.authorize` returns an auth_token + the user's selected account
 *   3. We hand the pubkey to the kolibri-gateway SIWS challenge endpoint
 */
export async function connectWallet(
  cluster: Cluster = 'devnet',
): Promise<WalletSession> {
  if (USE_STUB) return { ...STUB_SESSION, cluster };

  return transact(async (wallet: Web3MobileWallet) => {
    const auth = await wallet.authorize({
      cluster,
      identity: APP_IDENTITY,
    });
    const acct = auth.accounts[0];
    return {
      publicKey: new PublicKey(acct.address).toBase58(),
      walletName: auth.wallet_uri_base ?? 'MWA Wallet',
      label: acct.label,
      cluster,
      authToken: auth.auth_token,
    };
  });
}

/**
 * Sign an arbitrary UTF-8 payload via MWA (used for the SIWS challenge).
 * Returns the signature as base64.
 */
export async function signMessageWithWallet(
  session: WalletSession,
  message: string,
): Promise<string> {
  if (USE_STUB) return 'BASE64_MOCK_SIGNATURE==';

  const signed = await transact(async (wallet: Web3MobileWallet) => {
    const out = await wallet.signMessages({
      addresses: [session.publicKey],
      payloads: [Buffer.from(message, 'utf8')],
    });
    return out[0];
  });
  return Buffer.from(signed).toString('base64');
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
  unsignedTxBase64: string,
): Promise<string> {
  if (USE_STUB) {
    return '5xR2YpKsHaQ9LbVcZmJ7nT3fW4dE1uG6jBoPiNvMqApRzXcKtUwYlSeFhDgRmJ9LnPpTuQwXyAaCbDcEfGh9pL';
  }

  const tx = Transaction.from(Buffer.from(unsignedTxBase64, 'base64'));
  const signed = await transact(async (wallet: Web3MobileWallet) => {
    const result = await wallet.signTransactions({ transactions: [tx] });
    return result[0];
  });
  return Buffer.from(signed.serialize()).toString('base64');
}

// Cosmetic helper — turn a base58 sig into the short form printed everywhere.
export function truncateSignature(sig: string, head = 5, tail = 4): string {
  if (sig.length <= head + tail + 3) return sig;
  return `${sig.slice(0, head)}…${sig.slice(-tail)}`;
}

export const _internal = { APP_IDENTITY };
export type { Web3MobileWallet };
