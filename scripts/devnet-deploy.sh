#!/usr/bin/env bash
set -euo pipefail

: "${ANCHOR_WALLET:?Set ANCHOR_WALLET in your environment or .env}"

bash scripts/run-anchor.sh build --no-idl
bash scripts/run-anchor.sh deploy --provider.cluster devnet --provider.wallet "$ANCHOR_WALLET"
