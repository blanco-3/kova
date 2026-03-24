# x402 Escrow Protocol

Solana-native escrow for x402 payments. This project intercepts the standard x402 `402 Payment Required` flow and replaces direct settlement with an on-chain escrow that only releases USDC when the service result is delivered and verified.

## Problem

x402 makes HTTP-native payments possible for AI agents, but it does not guarantee atomicity between:

1. payment
2. service execution
3. result delivery

That creates three demoable failures:

- a seller can take payment and never return a result
- a server can fail after payment and leave the buyer with no refund path
- a direct x402 call cannot recover partial value in a chained agent flow

## Solution

`x402 Escrow Protocol` adds a Solana escrow vault in the middle of the flow:

1. an x402-protected endpoint returns real payment instructions
2. the middleware intercepts the 402 instead of paying directly
3. the buyer escrows USDC into a PDA-backed vault
4. the seller commits the SHA-256 hash of the result on-chain
5. the buyer verifies the delivered bytes and either releases or refunds

The escrow program supports:

- `create_escrow`
- `commit_result_hash`
- `verify_and_release`
- `claim_timeout_refund`
- `reject_result`

## Why Solana

- PDA vaults let the protocol derive isolated escrow accounts without private keys.
- CPI lets the program escrow and settle SPL Token funds atomically.
- Parallel execution makes independent escrows non-blocking.
- Devnet USDC gives the hackathon demo a realistic payment surface.
- The cost profile makes on-chain escrow practical where EVM-style deployments do not.

## Architecture

### Protocol

- Program: `programs/x402-escrow`
- Token: local synthetic USDC for tests, devnet USDC for demo
- Vault seed: `["escrow", buyer, seller, nonce_le_bytes]`
- Statuses: `Created`, `HashCommitted`, `Completed`, `Refunded`, `Disputed`

### Middleware

- `middleware/src/index.ts` owns the live demo API
- `middleware/src/escrow-client.ts` submits Anchor instructions with buyer/seller keypairs
- `middleware/src/types.ts` defines the run registry shape used by the UI
- The middleware keeps a small in-memory run registry instead of a database

### Demo servers

- `demo-servers/honest-server.ts` exposes a real x402-protected direct route and an escrow fulfillment route
- `demo-servers/malicious-server.ts` exposes the same shape but stalls after payment

### Frontend

- `app/src/app/page.tsx` renders the single-page demo dashboard
- `app/src/components/DemoDashboard.tsx` polls the middleware and launches scenarios
- `app/src/components/SplitView.tsx` contrasts direct x402 loss vs escrow protection

## Localnet flow

Use localnet for deterministic program development and Anchor tests.

```bash
npm install --legacy-peer-deps
npm run anchor:test
```

`npm run anchor:test` starts a clean local validator, deploys the current program build, and runs the TypeScript integration suite end to end.

The test suite creates a synthetic 6-decimal USDC mint and covers:

- create and release
- seller timeout refund
- buyer timeout seller claim
- buyer rejection
- hash mismatch
- wrong signer
- invalid deadline ordering
- repeated settlement protection

## Devnet demo flow

Use devnet for the judge-facing demo.

1. set `.env` from `.env.example`
2. point `SOLANA_RPC_URL` to devnet
3. use the devnet USDC mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
4. start the honest server, malicious server, middleware, and Next app
5. run the three scenarios from the dashboard

Suggested commands:

```bash
npm run demo:honest
npm run demo:malicious
npm run dev:middleware
npm run dev:app
```

The middleware exposes:

- `GET /health`
- `GET /api/escrows`
- `GET /api/escrows/:id`
- `POST /api/demo/run`

`POST /api/demo/run` accepts:

```json
{
  "scenario": "success | timeout | no_escrow",
  "prompt": "Translate 'trustless delivery' into Korean."
}
```

## Scripts

- `npm run check:rust`
- `npm run check:ts`
- `npm run anchor:build`
- `npm run anchor:test`
- `npm run localnet:start`
- `npm run devnet:deploy`
- `npm run devnet:smoke`
- `npm run dev:middleware`
- `npm run dev:app`
- `npm run demo:honest`
- `npm run demo:malicious`

## Environment

Copy `.env.example` and set:

- `SOLANA_RPC_URL`
- `ANCHOR_WALLET`
- `ESCROW_PROGRAM_ID`
- `DEVNET_USDC_MINT`
- `BUYER_KEYPAIR_PATH`
- `SELLER_KEYPAIR_PATH`
- `HONEST_SERVER_URL`
- `MALICIOUS_SERVER_URL`
- `FACILITATOR_URL`
- `NEXT_PUBLIC_DEMO_API_BASE`

## Demo outcomes

The dashboard is optimized around exactly three judge-facing scenarios:

1. `Honest Trade`
2. `Rugpull Defense`
3. `Without Escrow`

The UI shows:

- a before/after split view
- a live escrow tracker
- release/refund metrics
- recent run timelines with transaction signatures and result hashes

## Deployed addresses

Current program id:

- `x402_escrow`: `CTRDkdc7fN427u2p3gVHJvosy2GihnRwer5T6CM98xtH`

## Submission assets

- deck outline: [`pitch/deck-outline.md`](/Users/blanco/seoulana/pitch/deck-outline.md)
- demo script: [`pitch/demo-script.md`](/Users/blanco/seoulana/pitch/demo-script.md)
- judge Q&A: [`pitch/judge-qa.md`](/Users/blanco/seoulana/pitch/judge-qa.md)

## Current status

- Rust `cargo check` passes
- Anchor localnet integration suite passes (`8 passing`)
- workspace TypeScript checks pass
- Next production build passes
- middleware, demo servers, and dashboard are wired for the three judge-facing scenarios
