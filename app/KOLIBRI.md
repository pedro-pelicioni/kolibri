# Kolibri — Mobile App (Seeker)

React Native (TypeScript) app for the **Digital Plant Passport** flow.
Targets the Solana Seeker phone via the Mobile Wallet Adapter.

> Scaffold (RN 0.85.3) + our UI + MWA stub are already committed. Clone,
> `yarn install`, plug in your Seeker, `yarn android` — that's the whole
> dance.

## What's in here

```
app/
├── App.tsx                                # Scanner → Passport route switcher
├── index.js                               # RN entry + web3.js polyfills
├── android/, ios/                         # Native projects from react-native init
├── package.json                           # Includes @solana-mobile/* + lucide + svg
└── src/
    ├── theme/                             # Tokens (clinical greens, slate type, 4-pt grid)
    ├── types/passport.ts                  # PlantPassport / TimelineEvent / Proof types
    ├── mocks/passport.mock.ts             # Cannatonic CBD demo data
    ├── wallet/MobileWalletAdapter.ts      # MWA / Seed Vault — flip USE_STUB to go live
    ├── components/                        # VerifiedBadge · LabDataCard · TraceabilityTimeline · ProofOfExistenceCard · ConnectWalletButton
    └── screens/
        ├── ScannerScreen.tsx              # QR / NFC entry + wallet button
        └── PlantPassportScreen.tsx        # The certificate hero screen
```

## Run on Seeker (after `yarn install`)

```bash
# Terminal 1
yarn start

# Terminal 2 (Seeker plugged in via USB, debugging enabled)
yarn android
```

## Toggle real Seed Vault signing

Open `src/wallet/MobileWalletAdapter.ts`, change one line:

```ts
export const USE_STUB = false;   // was true
```

Rebuild (`yarn android`). The "Connect Wallet" button now opens the
Seed Vault biometric prompt on the Seeker instead of returning a mock.

## Wire to the gateway

The mock in `src/mocks/passport.mock.ts` mirrors what comes back from:

- `GET /batches/:id` → cultivator / batch fields
- `GET /batches/:id/events` → `timeline[]`
- `GET /events/by-pda/:pda` → `proof` (network, signature, PDA, slot, hash)

Gateway base: `https://dpo2u.com/kolibri`. OpenAPI spec at
`https://dpo2u.com/kolibri/openapi.json` — pipe through
`openapi-typescript` for fully-typed fetch wrappers (see `docs/MOBILE.md`).

## Hackathon talking points

- **Seed Vault signing** — every event signature is hardware-backed via
  the Seeker's secure element; the app never sees a private key.
- **NFC tap-to-verify** — same `onScanned(batchId)` callback feeds from
  Android's native NFC stack; dispensaries tap the package, no QR needed.
- **cNFT cost story** — emitting thousands of compliance certificates via
  Metaplex compressed NFTs costs fractions of a cent on Solana.
- **Canonical-JSON audit trail** — the SHA-256 shown on the PoE card is
  recomputable by any auditor against the Shadow Drive payload.
