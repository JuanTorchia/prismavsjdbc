#!/usr/bin/env bash
set -euo pipefail

LANGUAGE="${LAB_LANG:-es}"
COMPARISON_PATH="${COMPARISON_PATH:-results/comparison.csv}"
OUT_DIR="${OUT_DIR:-results/assets}"

node scripts/generate-content-assets.mjs --comparison "$COMPARISON_PATH" --out "$OUT_DIR" --lang "$LANGUAGE"
