#!/usr/bin/env bash
set -euo pipefail

MODE="${MODE:-smoke}"
OUTPUT_PATH="${OUTPUT_PATH:-results/matrix/node-matrix-summary.md}"

node scripts/compare-node-matrix.mjs --mode "$MODE" --output "$OUTPUT_PATH"
