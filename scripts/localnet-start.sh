#!/usr/bin/env bash
set -euo pipefail

LEDGER_DIR="${LEDGER_DIR:-.ledger/localnet}"
RPC_PORT="${RPC_PORT:-8899}"
WS_PORT="${WS_PORT:-8900}"
GOSSIP_PORT="${GOSSIP_PORT:-10240}"
FAUCET_PORT="${FAUCET_PORT:-9900}"
WALLET_PATH="${ANCHOR_WALLET:-$HOME/.config/solana/id.json}"

mkdir -p "$LEDGER_DIR"

solana-test-validator \
  --ledger "$LEDGER_DIR" \
  --rpc-port "$RPC_PORT" \
  --gossip-host 127.0.0.1 \
  --gossip-port "$GOSSIP_PORT" \
  --faucet-port "$FAUCET_PORT" \
  --dynamic-port-range 10241-10255 \
  --reset \
  --mint "$(solana-keygen pubkey "$WALLET_PATH")"
