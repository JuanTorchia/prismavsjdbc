#!/usr/bin/env bash
set -euo pipefail

MODE="${MODE:-editorial}"
OUTPUT_PATH="${OUTPUT_PATH:-results/matrix/java-matrix-summary.md}"

node scripts/compare-java-matrix.mjs --mode "$MODE" --output "$OUTPUT_PATH"
