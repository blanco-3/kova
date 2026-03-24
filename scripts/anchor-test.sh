#!/usr/bin/env bash
set -euo pipefail

if command -v brew >/dev/null 2>&1; then
  RUSTUP_PREFIX="$(brew --prefix rustup 2>/dev/null || true)"
  if [[ -n "${RUSTUP_PREFIX}" && -d "${RUSTUP_PREFIX}/bin" ]]; then
    export PATH="${RUSTUP_PREFIX}/bin:${PATH}"
  fi
fi

export COPYFILE_DISABLE=1
export COPY_EXTENDED_ATTRIBUTES_DISABLE=1

LEDGER_DIR="${ANCHOR_TEST_LEDGER_DIR:-.anchor/manual-test-ledger}"
RPC_URL="${ANCHOR_PROVIDER_URL:-http://127.0.0.1:8899}"
RPC_PORT="${ANCHOR_TEST_RPC_PORT:-8899}"
GOSSIP_PORT="${ANCHOR_TEST_GOSSIP_PORT:-10240}"
FAUCET_PORT="${ANCHOR_TEST_FAUCET_PORT:-9900}"
WALLET_PATH="${ANCHOR_WALLET:-$HOME/.config/solana/id.json}"
VALIDATOR_LOG="${LEDGER_DIR}/validator.log"

mkdir -p "$LEDGER_DIR"

cleanup() {
  if [[ -n "${VALIDATOR_PID:-}" ]]; then
    kill "${VALIDATOR_PID}" >/dev/null 2>&1 || true
    wait "${VALIDATOR_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

solana-test-validator \
  --ledger "$LEDGER_DIR" \
  --rpc-port "$RPC_PORT" \
  --gossip-host 127.0.0.1 \
  --gossip-port "$GOSSIP_PORT" \
  --faucet-port "$FAUCET_PORT" \
  --dynamic-port-range 10241-10255 \
  --reset \
  --mint "$(solana-keygen pubkey "$WALLET_PATH")" \
  >"$VALIDATOR_LOG" 2>&1 &
VALIDATOR_PID=$!

for _ in $(seq 1 30); do
  if solana cluster-version --url "$RPC_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! solana cluster-version --url "$RPC_URL" >/dev/null 2>&1; then
  cat "$VALIDATOR_LOG" >&2
  exit 1
fi

export ANCHOR_PROVIDER_URL="$RPC_URL"
export ANCHOR_WALLET="$WALLET_PATH"

bash scripts/run-anchor.sh build --no-idl
bash scripts/run-anchor.sh deploy --provider.cluster "$RPC_URL" --provider.wallet "$WALLET_PATH"
npx ts-mocha -p tsconfig.json -t 120000 tests/**/*.ts
