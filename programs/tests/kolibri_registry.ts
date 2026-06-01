import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import { KolibriRegistry } from "../target/types/kolibri_registry";

describe("kolibri_registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.kolibriRegistry as Program<KolibriRegistry>;

  // server-custody: a wallet do provider é a keypair de serviço (authority).
  const service = provider.wallet;
  const BATCH_SEED = Buffer.from("batch");

  function randomBytes(n: number): number[] {
    return Array.from({ length: n }, () => Math.floor(Math.random() * 256));
  }

  function deriveBatch(dispensary: PublicKey, batchId: number[]): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [BATCH_SEED, dispensary.toBuffer(), Buffer.from(batchId)],
      program.programId,
    );
    return pda;
  }

  before(async () => {
    // garante saldo no validador local pra pagar rent/fees
    const bal = await provider.connection.getBalance(service.publicKey);
    if (bal < LAMPORTS_PER_SOL) {
      const sig = await provider.connection.requestAirdrop(
        service.publicKey,
        10 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sig, "confirmed");
    }
  });

  it("registra planta (PoE root), grava eventos e vincula o NFT", async () => {
    const dispensary = Keypair.generate().publicKey;
    const batchId = randomBytes(16);
    const originHash = randomBytes(32);
    const batchPda = deriveBatch(dispensary, batchId);

    await program.methods
      .registerPlant(batchId, dispensary, 2, originHash, "shadow://origin")
      .accountsPartial({
        batch: batchPda,
        authority: service.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    let batch = await program.account.batch.fetch(batchPda);
    assert.equal(batch.eventCount.toNumber(), 1, "event_count inicial = 1");
    assert.equal(batch.originEventType, 2);
    assert.equal(batch.status, 0);
    assert.deepEqual([...batch.batchId], batchId);
    assert.deepEqual([...batch.originHash], originHash);
    assert.deepEqual([...batch.lastEventHash], originHash);
    assert.ok(batch.dispensary.equals(dispensary));
    assert.ok(batch.authority.equals(service.publicKey));
    assert.ok(batch.asset.equals(PublicKey.default));

    // HARVEST (6)
    const h6 = randomBytes(32);
    await program.methods
      .recordEvent(6, h6, "shadow://harvest")
      .accountsPartial({ batch: batchPda, authority: service.publicKey })
      .rpc();

    batch = await program.account.batch.fetch(batchPda);
    assert.equal(batch.eventCount.toNumber(), 2);
    assert.deepEqual([...batch.lastEventHash], h6, "guarda o hash do último evento");

    // vincula o NFT (mintado off-chain pela API via umi)
    const asset = Keypair.generate().publicKey;
    await program.methods
      .setAsset(asset)
      .accountsPartial({ batch: batchPda, authority: service.publicKey })
      .rpc();

    batch = await program.account.batch.fetch(batchPda);
    assert.ok(batch.asset.equals(asset), "asset vinculado");
  });

  it("RECALLED (14) muda o status para 1", async () => {
    const dispensary = Keypair.generate().publicKey;
    const batchId = randomBytes(16);
    const batchPda = deriveBatch(dispensary, batchId);

    await program.methods
      .registerPlant(batchId, dispensary, 1, randomBytes(32), "shadow://o")
      .accountsPartial({
        batch: batchPda,
        authority: service.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .recordEvent(14, randomBytes(32), "shadow://recall")
      .accountsPartial({ batch: batchPda, authority: service.publicKey })
      .rpc();

    const batch = await program.account.batch.fetch(batchPda);
    assert.equal(batch.status, 1, "status = Recalled");
  });

  it("aceita todos os 15 tipos de evento", async () => {
    const dispensary = Keypair.generate().publicKey;
    const batchId = randomBytes(16);
    const batchPda = deriveBatch(dispensary, batchId);

    await program.methods
      .registerPlant(batchId, dispensary, 1, randomBytes(32), "shadow://o")
      .accountsPartial({
        batch: batchPda,
        authority: service.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    for (let t = 1; t <= 13; t++) {
      await program.methods
        .recordEvent(t, randomBytes(32), `shadow://e${t}`)
        .accountsPartial({ batch: batchPda, authority: service.publicKey })
        .rpc();
    }
    const batch = await program.account.batch.fetch(batchPda);
    assert.equal(batch.eventCount.toNumber(), 14, "1 origem + 13 eventos");
  });

  it("rejeita event_type inválido", async () => {
    const dispensary = Keypair.generate().publicKey;
    const batchId = randomBytes(16);
    const batchPda = deriveBatch(dispensary, batchId);
    try {
      await program.methods
        .registerPlant(batchId, dispensary, 99, randomBytes(32), "x")
        .accountsPartial({
          batch: batchPda,
          authority: service.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("deveria ter falhado com InvalidEventType");
    } catch (e: unknown) {
      assert.include(String(e), "InvalidEventType");
    }
  });

  it("rejeita authority não autorizada no record_event", async () => {
    const dispensary = Keypair.generate().publicKey;
    const batchId = randomBytes(16);
    const batchPda = deriveBatch(dispensary, batchId);

    await program.methods
      .registerPlant(batchId, dispensary, 2, randomBytes(32), "o")
      .accountsPartial({
        batch: batchPda,
        authority: service.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const intruder = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(intruder.publicKey, LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig, "confirmed");

    try {
      await program.methods
        .recordEvent(6, randomBytes(32), "x")
        .accountsPartial({ batch: batchPda, authority: intruder.publicKey })
        .signers([intruder])
        .rpc();
      assert.fail("deveria ter falhado com Unauthorized");
    } catch (e: unknown) {
      assert.include(String(e), "Unauthorized");
    }
  });
});
