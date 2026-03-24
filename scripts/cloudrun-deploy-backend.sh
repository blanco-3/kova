#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-${GCLOUD_PROJECT:-$(gcloud config get-value project 2>/dev/null)}}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-kova-backend}"
REGION="${CLOUD_RUN_REGION:-asia-northeast3}"
FIRESTORE_LOCATION="${FIRESTORE_LOCATION:-$REGION}"
RUN_STORE_BACKEND="${RUN_STORE_BACKEND:-firestore}"
FIRESTORE_RUN_COLLECTION="${FIRESTORE_RUN_COLLECTION:-kova_demo_runs}"
FIRESTORE_DATABASE_ID="${FIRESTORE_DATABASE_ID:-}"
SIMULATE_PUBLIC_DEMO="${SIMULATE_PUBLIC_DEMO:-false}"

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env var: $name" >&2
    exit 1
  fi
}

yaml_quote() {
  local value="$1"
  value="${value//\'/\'\'}"
  printf "'%s'" "$value"
}

require_var PROJECT_ID
require_var SOLANA_RPC_URL
require_var ESCROW_PROGRAM_ID
require_var DEVNET_USDC_MINT
require_var FACILITATOR_URL
require_var DIRECT_X402_PRICE_USD

if [[ -z "${BUYER_KEYPAIR_JSON:-}" ]]; then
  require_var BUYER_KEYPAIR_PATH
  BUYER_KEYPAIR_JSON="$(tr -d '\n\r ' < "$BUYER_KEYPAIR_PATH")"
fi

if [[ -z "${SELLER_KEYPAIR_JSON:-}" ]]; then
  require_var SELLER_KEYPAIR_PATH
  SELLER_KEYPAIR_JSON="$(tr -d '\n\r ' < "$SELLER_KEYPAIR_PATH")"
fi

echo "Enabling required GCP services in project $PROJECT_ID..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  --project "$PROJECT_ID"

if ! gcloud firestore databases describe \
  --project "$PROJECT_ID" \
  ${FIRESTORE_DATABASE_ID:+--database "$FIRESTORE_DATABASE_ID"} \
  >/dev/null 2>&1; then
  echo "Creating Firestore database in $FIRESTORE_LOCATION..."
  gcloud firestore databases create \
    --project "$PROJECT_ID" \
    --location "$FIRESTORE_LOCATION" \
    ${FIRESTORE_DATABASE_ID:+--database "$FIRESTORE_DATABASE_ID"}
fi

TMP_ENV_FILE="$(mktemp)"
trap 'rm -f "$TMP_ENV_FILE"' EXIT

{
  echo "GOOGLE_CLOUD_PROJECT: $(yaml_quote "$PROJECT_ID")"
  echo "GCLOUD_PROJECT: $(yaml_quote "$PROJECT_ID")"
  echo "SOLANA_RPC_URL: $(yaml_quote "$SOLANA_RPC_URL")"
  echo "ESCROW_PROGRAM_ID: $(yaml_quote "$ESCROW_PROGRAM_ID")"
  echo "DEVNET_USDC_MINT: $(yaml_quote "$DEVNET_USDC_MINT")"
  echo "BUYER_KEYPAIR_JSON: $(yaml_quote "$BUYER_KEYPAIR_JSON")"
  echo "SELLER_KEYPAIR_JSON: $(yaml_quote "$SELLER_KEYPAIR_JSON")"
  echo "FACILITATOR_URL: $(yaml_quote "$FACILITATOR_URL")"
  echo "DIRECT_X402_PRICE_USD: $(yaml_quote "$DIRECT_X402_PRICE_USD")"
  echo "RUN_STORE_BACKEND: $(yaml_quote "$RUN_STORE_BACKEND")"
  echo "FIRESTORE_RUN_COLLECTION: $(yaml_quote "$FIRESTORE_RUN_COLLECTION")"
  echo "SIMULATE_PUBLIC_DEMO: $(yaml_quote "$SIMULATE_PUBLIC_DEMO")"
  if [[ -n "$FIRESTORE_DATABASE_ID" ]]; then
    echo "FIRESTORE_DATABASE_ID: $(yaml_quote "$FIRESTORE_DATABASE_ID")"
  fi
} >"$TMP_ENV_FILE"

echo "Deploying $SERVICE_NAME to Cloud Run in $REGION..."
gcloud run deploy "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --source "$BACKEND_DIR" \
  --allow-unauthenticated \
  --cpu 1 \
  --memory 1Gi \
  --timeout 180 \
  --env-vars-file "$TMP_ENV_FILE"

SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --format='value(status.url)')"

echo "Cloud Run backend URL: $SERVICE_URL"
