# Deployment Guide

## Recommended deployment shape

- frontend: Vercel
- public demo backend: GCP Cloud Run
- run persistence: Firestore
- full local dev stack: local Express services for honest + delivery-failure endpoints

## Why this split

The frontend is a standard Next.js app and fits Vercel well.

The judge-facing backend is more stable on Cloud Run because it avoids Vercel function limits and keeps the x402 demo flow on a single always-on HTTP service.

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

## Backend hosting on Cloud Run

### Required environment variables

- `SOLANA_RPC_URL`
- `ESCROW_PROGRAM_ID`
- `DEVNET_USDC_MINT`
- `BUYER_KEYPAIR_PATH` or `BUYER_KEYPAIR_JSON`
- `SELLER_KEYPAIR_PATH` or `SELLER_KEYPAIR_JSON`
- `FACILITATOR_URL`
- `DIRECT_X402_PRICE_USD`
- `RUN_STORE_BACKEND=firestore`
- `FIRESTORE_RUN_COLLECTION`
- `FIRESTORE_DATABASE_ID` (optional)
- `RUN_STORE_MAX` (optional)
- `SIMULATE_PUBLIC_DEMO=false` for live devnet settlement

### Deploy command

```bash
npm run gcp:backend:deploy
```

The deploy script will:

- enable Cloud Run, Cloud Build, Artifact Registry, and Firestore APIs
- create a Firestore database if one does not exist yet
- convert local buyer/seller keypair files into JSON env vars for Cloud Run
- deploy the backend as a single Cloud Run service
- keep the honest and delivery-failure endpoints mounted inside that same service

## Simplest demo deployment

1. deploy the frontend to Vercel
2. deploy the public backend to Cloud Run
3. confirm `/api/health` reports `"runStore": "firestore"`
4. update `NEXT_PUBLIC_DEMO_API_BASE` in Vercel
5. redeploy the frontend
6. test all three demo buttons end to end

## Pre-launch checklist

- frontend loads without local dependencies
- backend `/api/health` returns `ok: true`
- backend `/api/health` reports `"runStore": "firestore"`
- `Honest Trade` completes
- `Rugpull Defense` refunds
- `Without Escrow` reaches `lost`
