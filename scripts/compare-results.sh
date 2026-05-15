#!/usr/bin/env bash
set -euo pipefail

INPUT_PATH="${INPUT_PATH:-results/raw/latest.json}"
CSV_PATH="${CSV_PATH:-results/comparison.csv}"
MARKDOWN_PATH="${MARKDOWN_PATH:-results/comparison.md}"
LANGUAGE="${LAB_LANG:-es}"

node scripts/compare-results.mjs \
  --input "$INPUT_PATH" \
  --csv "$CSV_PATH" \
  --markdown "$MARKDOWN_PATH" \
  --lang "$LANGUAGE"
