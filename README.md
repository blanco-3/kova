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

Default local addresses:

- frontend: `http://127.0.0.1:3000`
- middleware: `http://127.0.0.1:8787`
- honest server: `http://127.0.0.1:8788`
- malicious server: `http://127.0.0.1:8789`

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

The public facilitator used by the demo is `https://www.x402.org/facilitator`.

## Quick start

Install dependencies:

```bash
npm install --legacy-peer-deps
```

Run the full devnet demo stack in separate terminals:

```bash
npm run demo:honest
npm run demo:malicious
npx tsx middleware/src/index.ts
npm run dev:app
```

Smoke-check the middleware path:

```bash
npm run devnet:smoke
```

## Frontend deployment

The frontend is a standalone Next.js app under `app/`.

Recommended judge-facing deployment:

- frontend: Vercel
- middleware + demo servers: an always-on Node host such as Render, Fly.io, Railway, or a VPS

To deploy the frontend on Vercel:

1. import this repository into Vercel
2. set the project root directory to `app`
3. set `NEXT_PUBLIC_DEMO_API_BASE` to the public middleware URL
4. deploy as a standard Next.js app

Important:

- the frontend needs a public middleware URL to run the live scenarios
- the current local default `http://127.0.0.1:8787` only works for local development
- Vercel is a good fit for the frontend, but the middleware/demo stack should run on an always-on Node service
- the hosted public backend runs in a synchronous demo mode so judges can click through the scenarios without depending on the local dev stack

Example production-style split:

- `https://kova-henna.vercel.app` -> frontend
- `https://kova-backend.vercel.app` -> public demo backend
- `https://kova-backend.vercel.app/api/demo/honest` -> honest demo endpoint
- `https://kova-backend.vercel.app/api/demo/malicious` -> malicious demo endpoint

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

Verified devnet assets:

- buyer: `GDf1HviXTMZaivFgTEV1JbjnAyqVHbTAv98qzqQLrV9J`
- seller: `GwESw1qndUrdc5XjrhRsyA8YztNf4q76AtJAw7LUsUn1`

## Verified devnet run

Validated on `2026-03-24` with the real devnet program and live x402 middleware flow.

- success flow
  - create escrow: `2UMbTjxw9piuoUXrE3k2cgKSoZUFqymgD2nU5mwAuf8uQEwP2bbxGxcabYq7iC4nvJauXHHMtY2TwK81jD1RZXL2`
  - commit hash: `3EVG4TtkAYAetMJ9atNpEvyq3EreDpSrRdJZgt39XCLDcBjN2ggJD4GQFCMDm4fyKzTqqjMPFtC7XiRYyvFXFKG9`
  - release: `4tydUFP2n4HCV2ckGmC4x75v4o4i3UjT6zh6Z98exyPTy9vktBTgRWUV1c435SXh2Bgj6Ja48o3wBZHATygEx6sv`
- timeout refund flow
  - create escrow: `26sabNNn9LBg2Vn8D2JXRKQGGNZnPrf3SxNa3T6iiCcWmyX1AuBbSDT5YWe7eY4xxpgU5C9DZQic2YPTnHuATuh2`
  - refund: `5aSNGeAHFo7auMVGDVmTBT2WxbTmhqhYhgaLf3m8KKDQU8dx89cNzDRBqS92Q8ogG9phkxJPKC5X58dGzrCNwsRt`

The `no_escrow` path was also validated through the middleware run registry and surfaces the direct-loss state in the UI.

## Submission assets

- deck outline: [pitch/deck-outline.md](pitch/deck-outline.md)
- demo script: [pitch/demo-script.md](pitch/demo-script.md)
- judge Q&A: [pitch/judge-qa.md](pitch/judge-qa.md)
- submission checklist: [pitch/submission-checklist.md](pitch/submission-checklist.md)
- submission copy: [pitch/submission-copy.md](pitch/submission-copy.md)

## Current status

- Rust `cargo check` passes
- Anchor localnet integration suite passes (`8 passing`)
- workspace TypeScript checks pass
- Next production build passes
- middleware, demo servers, and dashboard are wired for the three judge-facing scenarios
- frontend supports English / Korean UI toggle
