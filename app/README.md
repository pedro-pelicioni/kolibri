# Kolibri — Mobile App (Seeker)

Hackathon-ready React Native (TypeScript) scaffold for the **Digital Plant
Passport** flow. Targets the Solana Seeker.

## What's in here

```
app/
├── App.tsx                                # Scanner → Passport route switcher
└── src/
    ├── theme/                             # Design tokens
    │   ├── colors.ts                      # Clinical greens, slate typography
    │   ├── typography.ts                  # Sans-serif type scale
    │   └── spacing.ts                     # 4-pt grid + radius tokens
    ├── types/passport.ts                  # PlantPassport / TimelineEvent / Proof types
    ├── mocks/passport.mock.ts             # Cannatonic CBD demo data
    ├── wallet/MobileWalletAdapter.ts      # MWA / Seed Vault stub (Solana)
    ├── components/
    │   ├── VerifiedBadge.tsx              # Green "Verified Authentic" pill
    │   ├── LabDataCard.tsx                # 2×2 lab grid tile
    │   ├── TraceabilityTimeline.tsx       # Vertical Minespider stepper
    │   ├── ProofOfExistenceCard.tsx       # Dark Solana-receipt footer card
    │   └── ConnectWalletButton.tsx        # Big "Connect Wallet" CTA
    └── screens/
        ├── ScannerScreen.tsx              # QR / NFC entry + wallet button
        └── PlantPassportScreen.tsx        # The certificate hero screen
```

## Wire it up

1. **Scaffold the React Native project** (from the `app/` directory's parent):

   ```bash
   npx react-native@latest init KolibriApp --template react-native-template-typescript
   ```

2. **Copy the contents of `app/`** into the freshly generated `KolibriApp/`
   (replacing `App.tsx`, merging `src/`).

3. **Install runtime deps**:

   ```bash
   yarn add \
     @solana-mobile/mobile-wallet-adapter-protocol \
     @solana-mobile/mobile-wallet-adapter-protocol-web3js \
     @solana/web3.js \
     react-native-get-random-values \
     buffer \
     lucide-react-native \
     react-native-svg
   ```

   `lucide-react-native` requires `react-native-svg` as a peer dep.

4. **Flip the MWA stub off** — open `src/wallet/MobileWalletAdapter.ts`,
   set `USE_STUB = false`, and uncomment the three real-call blocks marked
   `=== Real MWA flow ===`.

5. **(Optional) Camera scanner** — add `react-native-vision-camera` and mount
   it inside the viewfinder cutout in `ScannerScreen.tsx`.

6. **Run on a Seeker** (or Android emulator with the MWA fakewallet APK):

   ```bash
   yarn android
   ```

## What the demo shows

- **Scanner** lights up the QR/NFC viewfinder placeholder and the
  Mobile Wallet Adapter "Connect Wallet" CTA.
- Tap **Demo · open mock passport** (or once VisionCamera is wired, scan
  a real QR pointing to a Kolibri batch id) → renders the Plant Passport.
- **Plant Passport** shows:
  - Hero strain block with the "Verified Authentic" badge
  - Quick-fact strip (harvest / weight / farm)
  - 2×2 Lab Panel with CBD%, THC% (`< 0.3% ANVISA`), totals + lab name
  - Compliance strip (microbiology / heavy metals / solvents / pesticides)
  - **Traceability Timeline** — Minespider-style vertical stepper, every
    step links to its Solana tx on Solscan
  - **Proof of Existence** dark card with the tx signature, PDA, slot,
    payload SHA-256 + Shadow Drive URI, and a "View on Solana Explorer" CTA

## Talking points for judges

- **Seed Vault signing** — every event signature is hardware-backed via
  the Seeker's secure element; the app never sees a private key.
- **NFC tap-to-verify** — same `onScanned(batchId)` callback feeds from
  Android's native NFC stack; dispensaries tap the package, no QR needed.
- **cNFT cost story** — emitting thousands of compliance certificates via
  Metaplex compressed NFTs costs fractions of a cent on Solana.
- **Canonical-JSON audit trail** — the SHA-256 shown on the PoE card is
  recomputable by any auditor against the Shadow Drive payload.

## Gateway pairing

This UI runs zero-network in demo mode. When you wire it to the real
gateway (`https://dpo2u.com/kolibri`), populate `mockPassport` from:

- `GET /batches/:id` → cultivator / batch fields
- `GET /batches/:id/events` → `timeline[]`
- `GET /events/by-pda/:pda` → `proof` (network, signature, PDA, slot, hash)

OpenAPI spec at `https://dpo2u.com/kolibri/openapi.json` — pipe through
`openapi-typescript` for fully-typed fetch wrappers.
