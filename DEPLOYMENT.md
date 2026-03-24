# Deployment Guide

## Recommended deployment shape

- frontend: Vercel
- public demo backend: Vercel serverless + Upstash Redis / Vercel KV for run persistence
- full local dev stack: local Express services for honest + delivery-failure endpoints

## Why this split

The frontend is a standard Next.js app and fits Vercel well.

The judge-facing backend can also run on Vercel now, as long as demo runs are persisted in Redis/KV instead of process memory.

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
- `KV_REST_API_URL` or `UPSTASH_REDIS_REST_URL`
- `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_TOKEN`
- `RUN_STORE_PREFIX` (optional)
- `RUN_STORE_MAX` (optional)

### Services to run

- middleware: `npx tsx middleware/src/index.ts`
- honest server: `npx tsx demo-servers/honest-server.ts`
- malicious server: `npx tsx demo-servers/malicious-server.ts`

## Simplest demo deployment

For the current hackathon demo, the stable setup is:

1. deploy the frontend to Vercel
2. deploy the public backend to Vercel
3. attach Upstash Redis / Vercel KV to the backend project
4. confirm `/api/health` reports `"runStore": "redis"`
5. update `NEXT_PUBLIC_DEMO_API_BASE` in Vercel
6. test all three demo buttons end to end

## Pre-launch checklist

- frontend loads without local dependencies
- backend `/api/health` returns `ok: true`
- backend `/api/health` reports `"runStore": "redis"`
- honest server `/health` returns `ok: true`
- malicious server `/health` returns `ok: true`
- `Honest Trade` completes
- `Rugpull Defense` refunds
- `Without Escrow` reaches `lost`
