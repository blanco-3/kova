# Deployment Guide

## Recommended deployment shape

- frontend: GCP Cloud Run
- public demo backend: GCP Cloud Run
- run persistence: Firestore
- full local dev stack: local Express services for honest + delivery-failure endpoints

## Why this split

The judge-facing frontend and backend both run on Cloud Run so the demo does not depend on Vercel Hobby limits.

Cloud Run also keeps the x402 demo flow and the Next.js frontend in the same GCP project, while Firestore handles run persistence.

## Frontend on Cloud Run

### Deploy command

```bash
NEXT_PUBLIC_DEMO_API_BASE=https://your-cloud-run-backend.run.app npm run gcp:frontend:deploy
```

The frontend deploy script:

- deploys the Next.js app in `app/` to a Cloud Run service named `kova-frontend`
- injects `NEXT_PUBLIC_DEMO_API_BASE` into both build-time and runtime env
- returns the Cloud Run frontend URL when deployment finishes

### Result

The deployed frontend points at the public backend URL and runs the same three scenarios as local development.

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

1. deploy the backend to Cloud Run
2. note the backend URL returned by Cloud Run
3. deploy the frontend to Cloud Run with `NEXT_PUBLIC_DEMO_API_BASE` set to the backend URL
4. confirm `/api/health` reports `"runStore": "firestore"`
5. open the frontend Cloud Run URL and test all three buttons
6. test all three demo buttons end to end

## Pre-launch checklist

- frontend loads without local dependencies
- backend `/api/health` returns `ok: true`
- backend `/api/health` reports `"runStore": "firestore"`
- `Honest Trade` completes
- `Rugpull Defense` refunds
- `Without Escrow` reaches `lost`
