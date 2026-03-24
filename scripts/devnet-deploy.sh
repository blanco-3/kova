#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

: "${ANCHOR_WALLET:?Set ANCHOR_WALLET in your environment or .env}"

bash scripts/run-anchor.sh build --no-idl
bash scripts/run-anchor.sh deploy --provider.cluster devnet --provider.wallet "$ANCHOR_WALLET"
