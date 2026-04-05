# x402 Escrow Protocol Deck Outline

## Slide 1 — Title

- x402 Escrow Protocol
- Proof-of-delivery escrow for x402 payments on Solana
- Promise: keep the x402 UX, change the settlement logic underneath it
- Visual: title + tracker screenshot or hero product shot

## Slide 2 — The Gap

- x402 enables HTTP-native payment transport
- it does not make payment and delivery atomic
- the buyer can still pay before delivery is proven
- Visual: `Without Escrow` lane ending in `lost`

## Slide 3 — Failure Modes

- paid, but the seller never delivers
- paid, but the server fails after payment
- the same trust gap compounds in longer agent flows
- live demo scope is the first case: one buyer, one seller, one delivery result
- Visual: three compact failure cards

## Slide 4 — What We Change

- the service still returns a real `402 Payment Required`
- middleware intercepts the paywall before direct settlement
- buyer funds a PDA-backed USDC escrow instead of paying the seller directly
- seller only gets paid after provable delivery
- Visual: before/after architecture split

## Slide 5 — On-chain Flow

- `create_escrow`
- `commit_result_hash`
- `verify_and_release`
- `claim_timeout_refund`
- `reject_result`
- Statuses to show: `Created -> HashCommitted -> Completed`, `Created -> Refunded`, `HashCommitted -> Disputed`
- Visual: state machine diagram

## Slide 6 — Live Demo Outcomes

- `Without Escrow` -> `lost` in the runtime/UI
- `Delivery Failure Protection` -> `refunded`
- `Honest Trade` -> `released`
- use the exact run order: `Without Escrow -> Delivery Failure Protection -> Honest Trade`
- Visual: three scenario columns with terminal states

## Slide 7 — Why Solana

- PDA vaults isolate escrow accounts without private-key management
- SPL Token CPI gives programmable USDC settlement
- fast finality makes live demo settlement understandable on stage
- low fees make on-chain escrow practical
- Visual: Solana capability callouts, not generic chain marketing

## Slide 8 — Proof Surface

- tracker shows `escrowPda`, transaction signatures, and `resultHash`
- README contains a verified devnet run with create, commit, release, and refund signatures
- local demo runs through middleware at `127.0.0.1:8787`
- public deployment is a frontend plus public backend on Cloud Run
- Visual: tracker crop plus shortened devnet signatures

## Slide 9 — Scope Boundary and Roadmap

- v1 proves delivery, not service quality
- current demo is buyer/seller only
- out of scope for now: mainnet, arbitration, long multi-agent chains
- roadmap: richer dispute handling, longer agent flows, broader deployment
- Visual: now / next split

## Slide 10 — Close

- x402 transports payment
- escrow makes delivery enforceable
- repo URL
- demo URL
- ask: judge the system on live proof, not just the claim
- Visual: closing statement + CTA
