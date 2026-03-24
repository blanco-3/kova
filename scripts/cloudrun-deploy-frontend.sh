#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/app"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
BACKEND_URL_OVERRIDE="${NEXT_PUBLIC_DEMO_API_BASE:-}"
PROJECT_ID_OVERRIDE="${GOOGLE_CLOUD_PROJECT:-${GCLOUD_PROJECT:-}}"
SERVICE_NAME_OVERRIDE="${FRONTEND_CLOUD_RUN_SERVICE:-}"
REGION_OVERRIDE="${CLOUD_RUN_REGION:-}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

PROJECT_ID="${PROJECT_ID_OVERRIDE:-${GOOGLE_CLOUD_PROJECT:-${GCLOUD_PROJECT:-$(gcloud config get-value project 2>/dev/null)}}}"
SERVICE_NAME="${SERVICE_NAME_OVERRIDE:-${FRONTEND_CLOUD_RUN_SERVICE:-kova-frontend}}"
REGION="${REGION_OVERRIDE:-${CLOUD_RUN_REGION:-asia-northeast3}}"
BACKEND_URL="${BACKEND_URL_OVERRIDE:-${NEXT_PUBLIC_DEMO_API_BASE:-}}"

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
require_var BACKEND_URL

echo "Enabling required GCP services in project $PROJECT_ID..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project "$PROJECT_ID"

TMP_RUNTIME_ENV="$(mktemp)"
TMP_BUILD_ENV="$(mktemp)"
trap 'rm -f "$TMP_RUNTIME_ENV" "$TMP_BUILD_ENV"' EXIT

{
  echo "NEXT_PUBLIC_DEMO_API_BASE: $(yaml_quote "$BACKEND_URL")"
} >"$TMP_RUNTIME_ENV"

{
  echo "NEXT_PUBLIC_DEMO_API_BASE: $(yaml_quote "$BACKEND_URL")"
  echo "NODE_ENV: 'production'"
} >"$TMP_BUILD_ENV"

echo "Deploying $SERVICE_NAME to Cloud Run in $REGION..."
gcloud run deploy "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --source "$APP_DIR" \
  --allow-unauthenticated \
  --cpu 1 \
  --memory 1Gi \
  --timeout 180 \
  --env-vars-file "$TMP_RUNTIME_ENV" \
  --build-env-vars-file "$TMP_BUILD_ENV"

SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --format='value(status.url)')"

echo "Cloud Run frontend URL: $SERVICE_URL"
