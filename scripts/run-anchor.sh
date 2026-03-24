#!/usr/bin/env bash
set -euo pipefail

if command -v brew >/dev/null 2>&1; then
  RUSTUP_PREFIX="$(brew --prefix rustup 2>/dev/null || true)"
  if [[ -n "${RUSTUP_PREFIX}" && -d "${RUSTUP_PREFIX}/bin" ]]; then
    export PATH="${RUSTUP_PREFIX}/bin:${PATH}"
  fi
fi

if ! command -v rustup >/dev/null 2>&1; then
  echo "rustup is required for Solana SBF builds. Install it first." >&2
  exit 1
fi

export COPYFILE_DISABLE=1
export COPY_EXTENDED_ATTRIBUTES_DISABLE=1

anchor "$@"
