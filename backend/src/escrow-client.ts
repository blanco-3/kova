import * as anchor from "@coral-xyz/anchor";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { X402_ESCROW_IDL } from "./idl";
import { loadSolanaKeypair } from "./keypair";

export interface EscrowConfig {
  rpcUrl: string;
  programId: string;
  mint: string;
  buyerKeypairPath?: string;
  buyerKeypairJson?: string;
  sellerKeypairPath?: string;
  sellerKeypairJson?: string;
}

export interface EscrowCreation {
  nonce: bigint;
  escrowPda: PublicKey;
  vaultAta: PublicKey;
  buyerAta: PublicKey;
  sellerAta: PublicKey;
  signature: string;
}

type EscrowProgram = anchor.Program<typeof X402_ESCROW_IDL>;

function walletFromKeypair(
  payer: Keypair
): anchor.Wallet & { payer: Keypair } {
  return {
    payer,
    publicKey: payer.publicKey,
    async signTransaction<T extends Transaction | VersionedTransaction>(
      tx: T
    ): Promise<T> {
      if (tx instanceof VersionedTransaction) {
        tx.sign([payer]);
      } else {
        tx.partialSign(payer);
      }
      return tx;
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(
      txs: T[]
    ): Promise<T[]> {
      return Promise.all(txs.map((tx) => this.signTransaction(tx)));
    },
  };
}

export class EscrowClient {
  readonly connection: Connection;
  readonly programId: PublicKey;
  readonly mint: PublicKey;
  readonly buyer: Keypair;
  readonly seller: Keypair;
  readonly buyerProgram: EscrowProgram;
  readonly sellerProgram: EscrowProgram;

  constructor(config: EscrowConfig) {
    this.connection = new Connection(config.rpcUrl, "confirmed");
    this.programId = new PublicKey(config.programId);
    this.mint = new PublicKey(config.mint);
    this.buyer = loadSolanaKeypair(
      {
        path: config.buyerKeypairPath,
        json: config.buyerKeypairJson,
      },
      "buyer"
    );
    this.seller = loadSolanaKeypair(
      {
        path: config.sellerKeypairPath,
        json: config.sellerKeypairJson,
      },
      "seller"
    );

    this.buyerProgram = this.createProgram(this.buyer);
    this.sellerProgram = this.createProgram(this.seller);
  }

  private createProgram(payer: Keypair): EscrowProgram {
    const wallet = walletFromKeypair(payer);
    const provider = new anchor.AnchorProvider(this.connection, wallet, {
      commitment: "confirmed",
    });

    return new anchor.Program({ ...X402_ESCROW_IDL, events: [] } as any, provider);
  }

  private nextNonce(): bigint {
    return BigInt(Date.now());
  }

  private deriveEscrowPda(nonce: bigint): PublicKey {
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64LE(nonce);

    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        this.buyer.publicKey.toBuffer(),
        this.seller.publicKey.toBuffer(),
        nonceBuffer,
      ],
      this.programId
    )[0];
  }

  private async ensureTokenAccounts() {
    const buyerAta = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.buyer,
      this.mint,
      this.buyer.publicKey
    );
    const sellerAta = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.buyer,
      this.mint,
      this.seller.publicKey
    );

    return {
      buyerAta: buyerAta.address,
      sellerAta: sellerAta.address,
    };
  }

  async createEscrow(params: {
    amount: number;
    submitDeadline: number;
    verifyDeadline: number;
  }): Promise<EscrowCreation> {
    const nonce = this.nextNonce();
    const escrowPda = this.deriveEscrowPda(nonce);
    const { buyerAta, sellerAta } = await this.ensureTokenAccounts();
    const vaultAta = await anchor.utils.token.associatedAddress({
      mint: this.mint,
      owner: escrowPda,
    });

    const nonceBn = new anchor.BN(nonce.toString());
    const amountBn = new anchor.BN(params.amount);
    const submitDeadlineBn = new anchor.BN(params.submitDeadline);
    const verifyDeadlineBn = new anchor.BN(params.verifyDeadline);

    const signature = await this.buyerProgram.methods
      .createEscrow(nonceBn, amountBn, submitDeadlineBn, verifyDeadlineBn)
      .accounts({
        buyer: this.buyer.publicKey,
        seller: this.seller.publicKey,
        mint: this.mint,
        escrow: escrowPda,
        buyerTokenAccount: buyerAta,
        vaultTokenAccount: vaultAta,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return {
      nonce,
      escrowPda,
      vaultAta,
      buyerAta,
      sellerAta,
      signature,
    };
  }

  async commitResultHash(escrowPda: PublicKey, resultHash: number[]) {
    return this.sellerProgram.methods
      .commitResultHash(resultHash)
      .accounts({
        seller: this.seller.publicKey,
        escrow: escrowPda,
      })
      .rpc();
  }

  async verifyAndRelease(
    escrowPda: PublicKey,
    vaultAta: PublicKey,
    sellerAta: PublicKey,
    resultBytes: Buffer
  ) {
    return this.buyerProgram.methods
      .verifyAndRelease([...resultBytes])
      .accounts({
        buyer: this.buyer.publicKey,
        escrow: escrowPda,
        vaultTokenAccount: vaultAta,
        sellerTokenAccount: sellerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }

  async rejectResult(escrowPda: PublicKey, vaultAta: PublicKey, buyerAta: PublicKey) {
    return this.buyerProgram.methods
      .rejectResult()
      .accounts({
        buyer: this.buyer.publicKey,
        escrow: escrowPda,
        vaultTokenAccount: vaultAta,
        buyerTokenAccount: buyerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }

  async claimBuyerRefund(
    escrowPda: PublicKey,
    vaultAta: PublicKey,
    buyerAta: PublicKey,
    sellerAta: PublicKey
  ) {
    return this.buyerProgram.methods
      .claimTimeoutRefund()
      .accounts({
        claimant: this.buyer.publicKey,
        escrow: escrowPda,
        vaultTokenAccount: vaultAta,
        buyerTokenAccount: buyerAta,
        sellerTokenAccount: sellerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }

  async claimSellerRelease(
    escrowPda: PublicKey,
    vaultAta: PublicKey,
    buyerAta: PublicKey,
    sellerAta: PublicKey
  ) {
    return this.sellerProgram.methods
      .claimTimeoutRefund()
      .accounts({
        claimant: this.seller.publicKey,
        escrow: escrowPda,
        vaultTokenAccount: vaultAta,
        buyerTokenAccount: buyerAta,
        sellerTokenAccount: sellerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }

  async fetchEscrowStatus(escrowPda: PublicKey): Promise<string> {
    const account = await (this.buyerProgram.account as any).escrowVault.fetch(
      escrowPda
    );
    const status = account.status as Record<string, unknown> | string;
    return typeof status === "string" ? status : Object.keys(status)[0] ?? "unknown";
  }
}
