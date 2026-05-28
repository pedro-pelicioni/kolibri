import type { PlantPassport, User } from '../types/passport';

// Mock data for the demo. The shape mirrors what the kolibri-gateway returns
// when you call: GET /batches/:id  +  GET /batches/:id/events  joined client-side.
// In production this object is rebuilt from on-chain events; here we hand-write
// it so the Passport screen renders pixel-perfect with no network calls.

export const mockUser: User = {
  email: 'operador@kolibri.com.br',
  name: 'Pedro Pelicioni',
  role: 'cultivator',
  dispensaryName: 'Fazenda Verde Saúde Ltda.',
  cnpj: '42.318.911/0001-04',
  anvisaLicense: 'ANVISA-CBD-2025-0421',
};

function makeBatch(args: {
  strainName: string;
  cultivarCode: string;
  batchId: string;
  batchLabel: string;
  netWeightGrams: number;
  harvestDate: string;
  createdAt: string;
  cbdPct: number;
  thcPct: number;
  photo: number; // require() asset id (mocked as plain int)
  txSignature: string;
  pda: string;
}): PlantPassport {
  return {
    strainName: args.strainName,
    cultivarCode: args.cultivarCode,
    batchId: args.batchId,
    batchLabel: args.batchLabel,
    harvestDate: args.harvestDate,
    packagedDate: args.createdAt,
    netWeightGrams: args.netWeightGrams,
    photoUri: `https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400&q=80&auto=format`,
    createdAt: args.createdAt,
    documents: [
      {
        name: 'Certificado de Análise (COA)',
        type: 'pdf',
        url: 'https://dpo2u.com/kolibri/sample-coa.pdf',
      },
      {
        name: 'Certificado ANVISA',
        type: 'pdf',
        url: 'https://dpo2u.com/kolibri/sample-anvisa.pdf',
      },
    ],
    cultivator: {
      name: mockUser.dispensaryName,
      cnpj: mockUser.cnpj,
      anvisaLicense: mockUser.anvisaLicense,
      farmLocation: 'Lavras, MG — Brasil',
    },
    lab: {
      cbdPct: args.cbdPct,
      thcPct: args.thcPct,
      totalCannabinoidsPct: args.cbdPct + args.thcPct + 0.5,
      terpenesPct: 2.04,
      microbiology: 'PASS',
      heavyMetals: 'PASS',
      residualSolvents: 'PASS',
      pesticides: 'PASS',
      labName: 'Labgen Análises Clínicas',
      labLicense: 'INMETRO-CRL-1287',
      coaUrl: 'shdw://kolibri/coa/' + args.batchId + '.pdf',
      testedAt: args.createdAt,
    },
    timeline: [
      {
        id: '01HV7M5N3A2B1C0D9E8F7G6H5J',
        title: 'Seed Planted',
        code: 'SEED_PLANTED',
        actor: 'cultivator',
        location: 'Estufa B-04, Lavras, MG',
        timestamp: '2026-01-08T08:00:00Z',
        txSignature: args.txSignature,
        verified: true,
      },
      {
        id: '01HVD2NK4PYR2ZH6V3CKQX8MJW',
        title: 'Harvest',
        code: 'HARVEST',
        actor: 'cultivator',
        location: 'Estufa B-04, Lavras, MG',
        timestamp: args.harvestDate,
        txSignature: args.txSignature,
        verified: true,
      },
      {
        id: '01HWZ7QK9XAY1P4HJN5VRTSGFE',
        title: 'Lab Result Released',
        code: 'LAB_RESULT_RELEASED',
        actor: 'lab',
        location: 'Labgen — Belo Horizonte, MG',
        timestamp: args.createdAt,
        txSignature: args.txSignature,
        verified: true,
      },
      {
        id: '01HX8VKNF5RQYR2K5L9WMZTSXY',
        title: 'Dispensary Received',
        code: 'TRANSFERRED',
        actor: 'dispensary',
        location: 'Farmácia Bem-Estar — Curitiba, PR',
        timestamp: args.createdAt,
        txSignature: args.txSignature,
        verified: true,
      },
    ],
    proof: {
      network: 'devnet',
      programId: 'FZ21S53Rn8Y6ANfccS2waCrkYWh5zfjXK3hkKU5YSkJ8',
      txSignature: args.txSignature,
      pda: args.pda,
      slot: 465_347_314,
      blockTime: args.createdAt,
      payloadSha256:
        'a3f9c5b1e2d4f60a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
      payloadUri: 'shdw://kolibri/payloads/' + args.batchId + '.json',
      explorerUrl:
        `https://solscan.io/tx/${args.txSignature}?cluster=devnet`,
    },
    verified: true,
  };
}

export const mockPassport: PlantPassport = makeBatch({
  strainName: 'Cannatonic CBD',
  cultivarCode: 'HEM:CBD1',
  batchId: '01HXYZ4K9V8A2BWMQ3DPRTNS6F',
  batchLabel: 'KOL-2026-0427-014',
  netWeightGrams: 30,
  harvestDate: '2026-03-12T13:24:00Z',
  createdAt: '2026-04-02T11:08:00Z',
  cbdPct: 18.42,
  thcPct: 0.18,
  photo: 0,
  txSignature:
    '5xR2YpKsHaQ9LbVcZmJ7nT3fW4dE1uG6jBoPiNvMqApRzXcKtUwYlSeFhDgRmJ9LnPpTuQwXyAaCbDcEfGh9pL',
  pda: 'BgF4Yk2Pq1zN7uJxR9aHcLmVeQwTbS3KdNfAoX8C6yEv',
});

// Lista pra popular o Home screen — 3 batches de variedades comuns no Brasil.
export const mockBatches: PlantPassport[] = [
  mockPassport,
  makeBatch({
    strainName: 'ACDC',
    cultivarCode: 'HEM:ACDC',
    batchId: '01HXYZ4K9V8A2BWMQ3DPRTNS7G',
    batchLabel: 'KOL-2026-0428-015',
    netWeightGrams: 15,
    harvestDate: '2026-03-20T10:00:00Z',
    createdAt: '2026-04-10T09:30:00Z',
    cbdPct: 16.71,
    thcPct: 0.22,
    photo: 0,
    txSignature:
      '7aH3xKpRsLfYjT9zMnQpW2vBcU5gKxF1RoB6Q4MeXp5TaCwKlVhDfYuPnTrSx2mLqJ8RkBpEoWaC9HiUyVx7Bb',
    pda: 'CnG5Zl3Qr2aO8vKyS0bIdMnWfRxUcT4LeOgBpY9D7zFw',
  }),
  makeBatch({
    strainName: 'Harlequin',
    cultivarCode: 'HEM:HARL',
    batchId: '01HXYZ4K9V8A2BWMQ3DPRTNS8H',
    batchLabel: 'KOL-2026-0429-016',
    netWeightGrams: 28,
    harvestDate: '2026-03-25T14:15:00Z',
    createdAt: '2026-04-18T16:00:00Z',
    cbdPct: 12.94,
    thcPct: 0.27,
    photo: 0,
    txSignature:
      '9bJ4yLqStMhZkU0aNrRqX3wCdV6hMyG2SpC7R5NfYq6UbDxLmWiEgZvQoUsTy3nMrK9SlCqFpXbD0IjVzWy8Cc',
    pda: 'DoH6Am4Rs3bP9wLzT1cJeNoXgSyVdU5MfPhCqZ8E8aGx',
  }),
];

// Helper pra criação — usado pelo CreateCertificateScreen.
export function makeNewBatch(input: {
  strainName: string;
  cultivarCode: string;
  netWeightGrams: number;
  harvestDate: string;
  notes?: string;
}): PlantPassport {
  const now = new Date().toISOString();
  const batchId = '01' + Math.random().toString(36).slice(2, 26).toUpperCase().padEnd(24, 'X');
  const sig = Array.from({ length: 88 }, () =>
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'[Math.floor(Math.random() * 58)]
  ).join('');
  return makeBatch({
    strainName: input.strainName,
    cultivarCode: input.cultivarCode,
    batchId,
    batchLabel: 'KOL-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 999).toString().padStart(3, '0'),
    netWeightGrams: input.netWeightGrams,
    harvestDate: input.harvestDate,
    createdAt: now,
    cbdPct: 18.42,
    thcPct: 0.18,
    photo: 0,
    txSignature: sig,
    pda: 'PDA' + Math.random().toString(36).slice(2, 42),
  });
}
