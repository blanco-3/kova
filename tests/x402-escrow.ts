import anchorPkg from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import crypto from "node:crypto";
import { X402_ESCROW_IDL } from "../middleware/src/idl.ts";

const anchor = anchorPkg as typeof import("@coral-xyz/anchor");
const { BN } = anchor;
type BNValue = InstanceType<typeof BN>;

type EscrowFixture = {
  seller: Keypair;
  sellerAta: PublicKey;
  nonce: BNValue;
  amount: BNValue;
  submitDeadline: BNValue;
  verifyDeadline: BNValue;
  escrowPda: PublicKey;
  vaultAta: PublicKey;
};

describe("x402-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program(
    { ...X402_ESCROW_IDL, events: [] } as any,
    provider as any
  ) as any;
  const programAny = program;
  const buyer = provider.wallet as unknown as {
    payer: Keypair;
    publicKey: PublicKey;
  };

  let mint: PublicKey;
  let buyerAta: PublicKey;
  let nonceCounter = 1;

  before(async () => {
    mint = await createMint(
      provider.connection,
      buyer.payer,
      buyer.publicKey,
      null,
      6
    );

    buyerAta = await createAssociatedTokenAccount(
      provider.connection,
      buyer.payer,
      mint,
      buyer.publicKey
    );

    await mintTo(
      provider.connection,
      buyer.payer,
      mint,
      buyerAta,
      buyer.publicKey,
      250_000_000
    );
  });

  async function buildFixture(overrides?: {
    amount?: number;
    submitInSeconds?: number;
    verifyInSeconds?: number;
  }): Promise<EscrowFixture> {
    const seller = Keypair.generate();
    const sellerAta = await createAssociatedTokenAccount(
      provider.connection,
      buyer.payer,
      mint,
      seller.publicKey
    );

    const nonce = new BN(nonceCounter++);
    const amount = new BN(overrides?.amount ?? 1_000_000);
    const now = Math.floor(Date.now() / 1000);
    const submitDeadline = new BN(now + (overrides?.submitInSeconds ?? 10));
    const verifyDeadline = new BN(now + (overrides?.verifyInSeconds ?? 40));

    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        buyer.publicKey.toBuffer(),
        seller.publicKey.toBuffer(),
        nonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const vaultAta = getAssociatedTokenAddressSync(mint, escrowPda, true);

    return {
      seller,
      sellerAta,
      nonce,
      amount,
      submitDeadline,
      verifyDeadline,
      escrowPda,
      vaultAta,
    };
  }

  async function getTokenBalance(address: PublicKey): Promise<number> {
    const account = await getAccount(provider.connection, address);
    return Number(account.amount);
  }

  async function createEscrow(fixture: EscrowFixture) {
    await programAny.methods
      .createEscrow(
        fixture.nonce,
        fixture.amount,
        fixture.submitDeadline,
        fixture.verifyDeadline
      )
      .accounts({
        buyer: buyer.publicKey,
        seller: fixture.seller.publicKey,
        mint,
        escrow: fixture.escrowPda,
        buyerTokenAccount: buyerAta,
        vaultTokenAccount: fixture.vaultAta,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async function fetchEscrowStatus(address: PublicKey): Promise<string> {
    const escrowAccount = await (program.account as any).escrowVault.fetch(address);
    const status = escrowAccount.status as Record<string, unknown> | string;

    if (typeof status === "string") {
      return status;
    }

    return Object.keys(status)[0] ?? "unknown";
  }

  async function expectFailure(
    callback: () => Promise<unknown>,
    expectedFragments: string[] = []
  ) {
    try {
      await callback();
      assert.fail("expected the instruction to fail");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expectedFragments.forEach((fragment) => assert.include(message, fragment));
    }
  }

  async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  it("creates an escrow, commits a hash, and releases funds after verification", async () => {
    const fixture = await buildFixture();
    const resultBytes = Buffer.from("translated: hello -> annyeonghaseyo");
    const resultHash = [
      ...crypto.createHash("sha256").update(resultBytes).digest(),
    ];

    const buyerBefore = await getTokenBalance(buyerAta);
    const sellerBefore = await getTokenBalance(fixture.sellerAta);

    await createEscrow(fixture);

    const buyerAfterCreate = await getTokenBalance(buyerAta);
    const vaultAfterCreate = await getTokenBalance(fixture.vaultAta);

    assert.equal(
      buyerAfterCreate,
      buyerBefore - fixture.amount.toNumber(),
      "buyer balance should decrease by the escrow amount"
    );
    assert.equal(
      vaultAfterCreate,
      fixture.amount.toNumber(),
      "vault ATA should receive the escrowed USDC"
    );

    await programAny.methods
      .commitResultHash(resultHash)
      .accounts({
        seller: fixture.seller.publicKey,
        escrow: fixture.escrowPda,
      })
      .signers([fixture.seller])
      .rpc();

    await programAny.methods
      .verifyAndRelease([...resultBytes])
      .accounts({
        buyer: buyer.publicKey,
        escrow: fixture.escrowPda,
        vaultTokenAccount: fixture.vaultAta,
        sellerTokenAccount: fixture.sellerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const sellerAfter = await getTokenBalance(fixture.sellerAta);
    const vaultAfter = await getTokenBalance(fixture.vaultAta);
    const status = await fetchEscrowStatus(fixture.escrowPda);

    assert.equal(
      sellerAfter,
      sellerBefore + fixture.amount.toNumber(),
      "seller should receive the released funds"
    );
    assert.equal(vaultAfter, 0, "vault should be emptied after settlement");
    assert.equal(status, "completed");
  });

  it("refunds the buyer when the seller misses the submit deadline", async () => {
    const fixture = await buildFixture({
      amount: 700_000,
      submitInSeconds: 1,
      verifyInSeconds: 6,
    });
    const buyerBefore = await getTokenBalance(buyerAta);

    await createEscrow(fixture);
    await sleep(2_500);

    await programAny.methods
      .claimTimeoutRefund()
      .accounts({
        claimant: buyer.publicKey,
        escrow: fixture.escrowPda,
        vaultTokenAccount: fixture.vaultAta,
        buyerTokenAccount: buyerAta,
        sellerTokenAccount: fixture.sellerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const buyerAfter = await getTokenBalance(buyerAta);
    const status = await fetchEscrowStatus(fixture.escrowPda);

    assert.equal(buyerAfter, buyerBefore, "buyer should be made whole");
    assert.equal(status, "refunded");
  });

  it("lets the seller claim after the buyer misses the verify deadline", async () => {
    const fixture = await buildFixture({
      amount: 900_000,
      submitInSeconds: 2,
      verifyInSeconds: 5,
    });
    const resultBytes = Buffer.from("translated: trustless delivery");
    const resultHash = [
      ...crypto.createHash("sha256").update(resultBytes).digest(),
    ];

    await createEscrow(fixture);
    await programAny.methods
      .commitResultHash(resultHash)
      .accounts({
        seller: fixture.seller.publicKey,
        escrow: fixture.escrowPda,
      })
      .signers([fixture.seller])
      .rpc();

    await sleep(6_000);

    await programAny.methods
      .claimTimeoutRefund()
      .accounts({
        claimant: fixture.seller.publicKey,
        escrow: fixture.escrowPda,
        vaultTokenAccount: fixture.vaultAta,
        buyerTokenAccount: buyerAta,
        sellerTokenAccount: fixture.sellerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([fixture.seller])
      .rpc();

    const sellerAfter = await getTokenBalance(fixture.sellerAta);
    const status = await fetchEscrowStatus(fixture.escrowPda);

    assert.equal(sellerAfter, fixture.amount.toNumber());
    assert.equal(status, "completed");
  });

  it("refunds the buyer and marks the escrow disputed when the buyer rejects the result", async () => {
    const fixture = await buildFixture({
      amount: 650_000,
    });
    const resultBytes = Buffer.from("translated: low quality result");
    const resultHash = [
      ...crypto.createHash("sha256").update(resultBytes).digest(),
    ];
    const buyerBefore = await getTokenBalance(buyerAta);

    await createEscrow(fixture);
    await programAny.methods
      .commitResultHash(resultHash)
      .accounts({
        seller: fixture.seller.publicKey,
        escrow: fixture.escrowPda,
      })
      .signers([fixture.seller])
      .rpc();

    await programAny.methods
      .rejectResult()
      .accounts({
        buyer: buyer.publicKey,
        escrow: fixture.escrowPda,
        vaultTokenAccount: fixture.vaultAta,
        buyerTokenAccount: buyerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const buyerAfter = await getTokenBalance(buyerAta);
    const status = await fetchEscrowStatus(fixture.escrowPda);

    assert.equal(buyerAfter, buyerBefore, "buyer should receive a refund");
    assert.equal(status, "disputed");
  });

  it("rejects hash mismatches during verification", async () => {
    const fixture = await buildFixture();
    const committedBytes = Buffer.from("correct result payload");
    const committedHash = [
      ...crypto.createHash("sha256").update(committedBytes).digest(),
    ];
    const wrongBytes = Buffer.from("tampered result payload");

    await createEscrow(fixture);
    await programAny.methods
      .commitResultHash(committedHash)
      .accounts({
        seller: fixture.seller.publicKey,
        escrow: fixture.escrowPda,
      })
      .signers([fixture.seller])
      .rpc();

    await expectFailure(
      () =>
        programAny.methods
          .verifyAndRelease([...wrongBytes])
          .accounts({
            buyer: buyer.publicKey,
            escrow: fixture.escrowPda,
            vaultTokenAccount: fixture.vaultAta,
            sellerTokenAccount: fixture.sellerAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc(),
      ["does not match"]
    );
  });

  it("rejects commits from the wrong signer", async () => {
    const fixture = await buildFixture();
    const attacker = Keypair.generate();
    const resultHash = Array(32).fill(7);

    await createEscrow(fixture);

    await expectFailure(
      () =>
        programAny.methods
          .commitResultHash(resultHash)
          .accounts({
            seller: attacker.publicKey,
            escrow: fixture.escrowPda,
          })
          .signers([attacker])
          .rpc(),
      []
    );
  });

  it("rejects invalid deadline ordering during escrow creation", async () => {
    const fixture = await buildFixture({
      submitInSeconds: 10,
      verifyInSeconds: 5,
    });

    await expectFailure(
      () =>
        programAny.methods
          .createEscrow(
            fixture.nonce,
            fixture.amount,
            fixture.submitDeadline,
            fixture.verifyDeadline
          )
          .accounts({
            buyer: buyer.publicKey,
            seller: fixture.seller.publicKey,
            mint,
            escrow: fixture.escrowPda,
            buyerTokenAccount: buyerAta,
            vaultTokenAccount: fixture.vaultAta,
            associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc(),
      ["verification deadline"]
    );
  });

  it("prevents repeated settlement after an escrow is completed", async () => {
    const fixture = await buildFixture();
    const resultBytes = Buffer.from("final settlement result");
    const resultHash = [
      ...crypto.createHash("sha256").update(resultBytes).digest(),
    ];

    await createEscrow(fixture);
    await programAny.methods
      .commitResultHash(resultHash)
      .accounts({
        seller: fixture.seller.publicKey,
        escrow: fixture.escrowPda,
      })
      .signers([fixture.seller])
      .rpc();

    await programAny.methods
      .verifyAndRelease([...resultBytes])
      .accounts({
        buyer: buyer.publicKey,
        escrow: fixture.escrowPda,
        vaultTokenAccount: fixture.vaultAta,
        sellerTokenAccount: fixture.sellerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    await expectFailure(
      () =>
        programAny.methods
          .claimTimeoutRefund()
          .accounts({
            claimant: buyer.publicKey,
            escrow: fixture.escrowPda,
            vaultTokenAccount: fixture.vaultAta,
            buyerTokenAccount: buyerAta,
            sellerTokenAccount: fixture.sellerAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc(),
      ["No timeout-based settlement condition"]
    );
  });
});
