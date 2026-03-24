import { createHash } from "node:crypto";
import type { Idl } from "@coral-xyz/anchor";

function discriminator(namespace: string, name: string): number[] {
  return [...createHash("sha256").update(`${namespace}:${name}`).digest()].slice(0, 8);
}

export const X402_ESCROW_IDL: Idl = {
  address: "CTRDkdc7fN427u2p3gVHJvosy2GihnRwer5T6CM98xtH",
  metadata: {
    name: "x402_escrow",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Solana-native x402 escrow protocol",
    deployments: {
      localnet: "CTRDkdc7fN427u2p3gVHJvosy2GihnRwer5T6CM98xtH",
      devnet: "CTRDkdc7fN427u2p3gVHJvosy2GihnRwer5T6CM98xtH",
    },
  },
  instructions: [
    {
      name: "createEscrow",
      discriminator: discriminator("global", "create_escrow"),
      accounts: [
        { name: "buyer", writable: true, signer: true },
        { name: "seller" },
        { name: "mint" },
        { name: "escrow", writable: true },
        { name: "buyerTokenAccount", writable: true },
        { name: "vaultTokenAccount", writable: true },
        { name: "associatedTokenProgram" },
        { name: "tokenProgram" },
        { name: "systemProgram" },
      ],
      args: [
        { name: "nonce", type: "u64" },
        { name: "amount", type: "u64" },
        { name: "submitDeadline", type: "i64" },
        { name: "verifyDeadline", type: "i64" },
      ],
    },
    {
      name: "commitResultHash",
      discriminator: discriminator("global", "commit_result_hash"),
      accounts: [
        { name: "seller", writable: true, signer: true },
        { name: "escrow", writable: true },
      ],
      args: [{ name: "resultHash", type: { array: ["u8", 32] } }],
    },
    {
      name: "verifyAndRelease",
      discriminator: discriminator("global", "verify_and_release"),
      accounts: [
        { name: "buyer", writable: true, signer: true },
        { name: "escrow", writable: true },
        { name: "vaultTokenAccount", writable: true },
        { name: "sellerTokenAccount", writable: true },
        { name: "tokenProgram" },
      ],
      args: [{ name: "resultBytes", type: { vec: "u8" } }],
    },
    {
      name: "claimTimeoutRefund",
      discriminator: discriminator("global", "claim_timeout_refund"),
      accounts: [
        { name: "claimant", writable: true, signer: true },
        { name: "escrow", writable: true },
        { name: "vaultTokenAccount", writable: true },
        { name: "buyerTokenAccount", writable: true },
        { name: "sellerTokenAccount", writable: true },
        { name: "tokenProgram" },
      ],
      args: [],
    },
    {
      name: "rejectResult",
      discriminator: discriminator("global", "reject_result"),
      accounts: [
        { name: "buyer", writable: true, signer: true },
        { name: "escrow", writable: true },
        { name: "vaultTokenAccount", writable: true },
        { name: "buyerTokenAccount", writable: true },
        { name: "tokenProgram" },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "escrowVault",
      discriminator: discriminator("account", "EscrowVault"),
    },
  ],
  events: [
    { name: "EscrowCreated", discriminator: discriminator("event", "EscrowCreated") },
    {
      name: "ResultHashCommitted",
      discriminator: discriminator("event", "ResultHashCommitted"),
    },
    { name: "EscrowReleased", discriminator: discriminator("event", "EscrowReleased") },
    { name: "EscrowRefunded", discriminator: discriminator("event", "EscrowRefunded") },
    { name: "EscrowDisputed", discriminator: discriminator("event", "EscrowDisputed") },
  ],
  errors: [
    { code: 6000, name: "InvalidAmount", msg: "The escrow amount must be greater than zero." },
    {
      code: 6001,
      name: "InvalidSubmitDeadline",
      msg: "The submit deadline must be in the future.",
    },
    {
      code: 6002,
      name: "InvalidVerifyDeadline",
      msg: "The verification deadline must be after the submit deadline.",
    },
    {
      code: 6003,
      name: "InvalidEscrowState",
      msg: "The escrow is not in the required state for this operation.",
    },
    {
      code: 6004,
      name: "SubmitDeadlineExpired",
      msg: "The seller submission deadline has expired.",
    },
    {
      code: 6005,
      name: "VerifyDeadlineExpired",
      msg: "The buyer verification deadline has expired.",
    },
    { code: 6006, name: "MissingCommittedHash", msg: "The committed hash is missing." },
    {
      code: 6007,
      name: "HashMismatch",
      msg: "The delivered result hash does not match the committed hash.",
    },
    { code: 6008, name: "UnauthorizedBuyer", msg: "Only the buyer can perform this action." },
    { code: 6009, name: "UnauthorizedSeller", msg: "Only the seller can perform this action." },
    {
      code: 6010,
      name: "InvalidVaultAuthority",
      msg: "The escrow vault authority is invalid.",
    },
    {
      code: 6011,
      name: "InvalidMint",
      msg: "The token mint does not match the escrow configuration.",
    },
    {
      code: 6012,
      name: "NoTimeoutConditionMet",
      msg: "No timeout-based settlement condition has been met.",
    },
  ],
  types: [
    {
      name: "EscrowVault",
      type: {
        kind: "struct",
        fields: [
          { name: "buyer", type: "pubkey" },
          { name: "seller", type: "pubkey" },
          { name: "mint", type: "pubkey" },
          { name: "amount", type: "u64" },
          { name: "nonce", type: "u64" },
          { name: "resultHash", type: { option: { array: ["u8", 32] } } },
          { name: "status", type: { defined: { name: "EscrowStatus" } } },
          { name: "submitDeadline", type: "i64" },
          { name: "verifyDeadline", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "EscrowStatus",
      type: {
        kind: "enum",
        variants: [
          { name: "Created" },
          { name: "HashCommitted" },
          { name: "Completed" },
          { name: "Refunded" },
          { name: "Disputed" },
        ],
      },
    },
    {
      name: "ReleaseReason",
      type: {
        kind: "enum",
        variants: [{ name: "Verified" }, { name: "BuyerTimeout" }],
      },
    },
    {
      name: "RefundReason",
      type: {
        kind: "enum",
        variants: [{ name: "SubmitTimeout" }, { name: "BuyerRejected" }],
      },
    },
  ],
};
