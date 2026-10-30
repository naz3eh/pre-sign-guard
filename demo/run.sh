#!/usr/bin/env bash
# One-command demo: replays the real Binance 14 authorization plus two
# constructed cases through the guard. No secrets, no network — under 30 s.
set -euo pipefail
cd "$(dirname "$0")/.."
exec npx --yes tsx demo/binance14.ts
