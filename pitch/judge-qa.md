# Judge Q&A

## What is technically new here?

The novelty is not escrow by itself. The novelty is an escrow layer that intercepts an x402 HTTP payment challenge and swaps direct settlement for a Solana-native delivery-gated flow. The demo proves that the x402 UX can remain intact while settlement logic changes underneath it.

## Are you replacing x402?

No. We are building on top of it. The protected direct route still returns a real `402 Payment Required` challenge. What changes is the settlement path after that challenge. Instead of paying the seller directly, the middleware funds escrow first.

## What is actually on-chain in the demo?

Escrow creation, hash commitment, release, refund, and dispute-triggered refund are on-chain. The proof surface is the escrow PDA, the transaction signatures, and the committed result hash. The `lost` outcome in the direct x402 path is intentionally not an on-chain escrow state because no escrow exists in that path.

## Why not just use an off-chain escrow?

Because the protocol needs deterministic, programmable release and refund paths that an agent can call automatically. Solana gives PDA vaults, SPL token settlement, and cheap enough costs to keep the protection on-chain.

## Why Solana instead of another cheap chain?

Because Solana already has x402 attention, facilitator coverage, and an account model that maps naturally to isolated escrow vaults. The user experience is stronger when the escrow lives where the x402 traffic already exists.

## Are you judging service quality on-chain?

No. v1 only judges delivery. The buyer confirms that the returned bytes match the committed hash. That is the smallest trust primitive missing from x402 today.

## What happens if the seller sends garbage right before timeout?

The protocol separates submit and verify deadlines. The seller must commit before the submit deadline, and the buyer still has a dedicated verify window to reject and force refund.

## Is the demo real or simulated?

The direct paid route uses real x402 packages and returns a real 402 challenge. The escrow path uses a real on-chain escrow flow on Solana devnet. The repository README includes a verified devnet run, and the UI exposes the same proof surface through the tracker.

## Why do you say `middleware` locally and `public backend` in deployment?

Locally, the demo stack is a middleware service at `127.0.0.1:8787` plus honest and malicious upstream endpoints. In deployment, the public service is packaged as a backend on Cloud Run. We keep those names separate so the local architecture and deployed topology do not get conflated on stage.

## What is out of scope for this hackathon version?

- quality scoring
- multi-agent chains longer than A -> B
- third-party arbitration
- mainnet deployment
