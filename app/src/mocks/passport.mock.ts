import type { PlantPassport } from '../types/passport';

// Mock data for the demo. The shape mirrors what the kolibri-gateway returns
// when you call: GET /batches/:id  +  GET /batches/:id/events  joined client-side.
// In production this object is rebuilt from on-chain events; here we hand-write
// it so the Passport screen renders pixel-perfect with no network calls.
//
// Tx signature, PDA and program id are real-looking but for demo only.
// Replace via the kolibri-gateway `/tx/submit` response in production.
export const mockPassport: PlantPassport = {
  strainName: 'Cannatonic CBD',
  cultivarCode: 'HEM:CBD1',
  batchId: '01HXYZ4K9V8A2BWMQ3DPRTNS6F',
  batchLabel: 'KOL-2026-0427-014',
  harvestDate: '2026-03-12T13:24:00Z',
  packagedDate: '2026-05-10T09:15:00Z',
  netWeightGrams: 30,

  cultivator: {
    name: 'Fazenda Verde Saúde Ltda.',
    cnpj: '42.318.911/0001-04',
    anvisaLicense: 'ANVISA-CBD-2025-0421',
    farmLocation: 'Lavras, MG — Brasil',
  },

  lab: {
    cbdPct: 18.42,
    thcPct: 0.18, // < 0.3% per ANVISA RDC 1.015/2026
    totalCannabinoidsPct: 19.10,
    terpenesPct: 2.04,
    microbiology: 'PASS',
    heavyMetals: 'PASS',
    residualSolvents: 'PASS',
    pesticides: 'PASS',
    labName: 'Labgen Análises Clínicas',
    labLicense: 'INMETRO-CRL-1287',
    coaUrl: 'shdw://kolibri/coa/01HXYZ4K9V8A2BWMQ3DPRTNS6F.pdf',
    testedAt: '2026-04-02T11:08:00Z',
  },

  timeline: [
    {
      id: '01HV7M5N3A2B1C0D9E8F7G6H5J',
      title: 'Seed Planted',
      code: 'SEED_PLANTED',
      actor: 'cultivator',
      location: 'Estufa B-04, Lavras, MG',
      timestamp: '2026-01-08T08:00:00Z',
      txSignature:
        '4xT2zKbRpL8aQwQ6vS3WjV5kYHfNcEbJpA9mDqLrTxC1yU7sPnZmBdGfHkEoVQXi2WaJBy6mCfRkLnPpTuQwXyAa',
      verified: true,
    },
    {
      id: '01HVD2NK4PYR2ZH6V3CKQX8MJW',
      title: 'Harvest',
      code: 'HARVEST',
      actor: 'cultivator',
      location: 'Estufa B-04, Lavras, MG',
      timestamp: '2026-03-12T13:24:00Z',
      txSignature:
        '3rGmPbLfYqWtH7Z2xV8nCkUjE9JsAdN1RoB6Q4MeXp5TaCwKlVhDfYuPnTrSx2mLqJ8RkBpEoWaC9HiUyVx7Aa',
      verified: true,
    },
    {
      id: '01HWZ7QK9XAY1P4HJN5VRTSGFE',
      title: 'Lab Result Released',
      code: 'LAB_RESULT_RELEASED',
      actor: 'lab',
      location: 'Labgen — Belo Horizonte, MG',
      timestamp: '2026-04-02T11:08:00Z',
      txSignature:
        '5xR2YpKsHaQ9LbVcZmJ7nT3fW4dE1uG6jBoPiNvMqApRzXcKtUwYlSeFhDgRmJ9LnPpTuQwXyAaCbDcEfGh9pL',
      verified: true,
    },
    {
      id: '01HX2C0J3RQYR2K5LMWZTSXNVQ',
      title: 'Transferred to Dispensary',
      code: 'TRANSFERRED',
      actor: 'logistics',
      location: 'Curitiba, PR (Loggi Pharma)',
      timestamp: '2026-05-11T14:42:00Z',
      txSignature:
        '2mWqLfA1yR8HpKnD3UoVcXz9bGeJrPiNvMqApRzXcKtUwYlSeFhDgRmJ9LnPpTuQwXyAaCbDcEfGh9pLAa',
      verified: true,
    },
    {
      id: '01HX8VKNF5RQYR2K5L9WMZTSXY',
      title: 'Dispensary Received',
      code: 'TRANSFERRED', // marked received on dispensary side; on-chain code is still TRANSFERRED with role=dispensary
      actor: 'dispensary',
      location: 'Farmácia Bem-Estar — Curitiba, PR',
      timestamp: '2026-05-13T10:02:00Z',
      txSignature:
        '7tA1yR8HpKnD3UoVcXz9bGeJrPiNvMqApRzXcKtUwYlSeFhDgRmJ9LnPpTuQwXyAaCbDcEfGh9pLAa2mWqLf',
      verified: true,
    },
  ],

  proof: {
    network: 'devnet',
    programId: 'FZ21S53Rn8Y6ANfccS2waCrkYWh5zfjXK3hkKU5YSkJ8',
    txSignature:
      '5xR2YpKsHaQ9LbVcZmJ7nT3fW4dE1uG6jBoPiNvMqApRzXcKtUwYlSeFhDgRmJ9LnPpTuQwXyAaCbDcEfGh9pL',
    pda: 'BgF4Yk2Pq1zN7uJxR9aHcLmVeQwTbS3KdNfAoX8C6yEv',
    slot: 465_347_314,
    blockTime: '2026-04-02T11:08:14Z',
    payloadSha256:
      'a3f9c5b1e2d4f60a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
    payloadUri: 'shdw://kolibri/payloads/01HWZ7QK9XAY1P4HJN5VRTSGFE.json',
    explorerUrl:
      'https://solscan.io/tx/5xR2YpKsHaQ9LbVcZmJ7nT3fW4dE1uG6jBoPiNvMqApRzXcKtUwYlSeFhDgRmJ9LnPpTuQwXyAaCbDcEfGh9pL?cluster=devnet',
  },

  verified: true,
};
