# Deployment Guide

## Recommended deployment shape

- frontend: Vercel
- middleware: Render / Fly.io / Railway / VPS
- honest demo server: same Node host or separate service
- malicious demo server: same Node host or separate service

## Why this split

The frontend is a standard Next.js app and fits Vercel well.

The middleware and demo servers are long-running Node services that keep in-memory state for the demo flow, so they should run on an always-on host instead of a purely serverless environment.

## Frontend on Vercel

### Settings

- Framework: `Next.js`
- Root directory: `app`
- Install command: leave default
- Build command: leave default

### Environment variable

- `NEXT_PUBLIC_DEMO_API_BASE=https://your-public-middleware.example.com`

### Result

The deployed frontend should point at the public middleware URL and will run the same three scenarios as local development.

## Backend hosting

### Required environment variables

- `SOLANA_RPC_URL`
- `ANCHOR_WALLET`
- `ESCROW_PROGRAM_ID`
- `DEVNET_USDC_MINT`
- `BUYER_KEYPAIR_PATH`
- `SELLER_KEYPAIR_PATH`
- `HONEST_SERVER_URL`
- `MALICIOUS_SERVER_URL`
- `FACILITATOR_URL`
- `MIDDLEWARE_PORT`
- `DIRECT_X402_PRICE_USD`

### Services to run

- middleware: `npx tsx middleware/src/index.ts`
- honest server: `npx tsx demo-servers/honest-server.ts`
- malicious server: `npx tsx demo-servers/malicious-server.ts`

## Simplest demo deployment

For a hackathon demo, the easiest stable setup is:

1. deploy frontend to Vercel
2. deploy middleware to one always-on Node service
3. deploy honest and malicious endpoints as two additional always-on Node services
4. update `NEXT_PUBLIC_DEMO_API_BASE` in Vercel
5. test all three demo buttons end to end

## Pre-launch checklist

- frontend loads without local dependencies
- middleware `/health` returns `ok: true`
- honest server `/health` returns `ok: true`
- malicious server `/health` returns `ok: true`
- `Honest Trade` completes
- `Rugpull Defense` refunds
- `Without Escrow` reaches `lost`
