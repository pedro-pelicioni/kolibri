-- CreateTable
CREATE TABLE "Dispensary" (
    "id" TEXT NOT NULL,
    "walletPubkey" TEXT NOT NULL,
    "name" TEXT,
    "cnpj" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispensary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "dispensaryId" TEXT NOT NULL,
    "cultivarCode" TEXT NOT NULL,
    "cultivarFull" TEXT,
    "genotype" TEXT,
    "originEventType" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "imageUri" TEXT,
    "cluster" TEXT NOT NULL DEFAULT 'devnet',
    "programId" TEXT,
    "pda" TEXT,
    "asset" TEXT,
    "registerTxSig" TEXT,
    "anchoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "eventType" INTEGER NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "canonicalJson" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "storageUri" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "solanaPda" TEXT,
    "solanaTxSig" TEXT,
    "anchoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "storageUri" TEXT NOT NULL,
    "sha256Hex" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthNonce" (
    "nonce" TEXT NOT NULL,
    "pubkey" TEXT,
    "inputJson" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthNonce_pkey" PRIMARY KEY ("nonce")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dispensary_walletPubkey_key" ON "Dispensary"("walletPubkey");

-- CreateIndex
CREATE INDEX "Batch_dispensaryId_idx" ON "Batch"("dispensaryId");

-- CreateIndex
CREATE INDEX "Event_batchId_idx" ON "Event"("batchId");

-- CreateIndex
CREATE INDEX "Event_anchoredAt_idx" ON "Event"("anchoredAt");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_dispensaryId_fkey" FOREIGN KEY ("dispensaryId") REFERENCES "Dispensary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
