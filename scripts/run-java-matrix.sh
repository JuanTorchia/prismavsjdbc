#!/usr/bin/env bash
set -euo pipefail

MODE="smoke"
SIZE="small"
RUNS=""
REQUESTS=""
WARMUP=""
CONCURRENCY=""
SKIP_BUILD="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --size) SIZE="$2"; shift 2 ;;
    --runs) RUNS="$2"; shift 2 ;;
    --requests) REQUESTS="$2"; shift 2 ;;
    --warmup) WARMUP="$2"; shift 2 ;;
    --concurrency) CONCURRENCY="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD="true"; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

RUNS="${RUNS:-$([[ "$MODE" == "editorial" ]] && echo 3 || echo 1)}"
REQUESTS="${REQUESTS:-$([[ "$MODE" == "editorial" ]] && echo 300 || echo 20)}"
WARMUP="${WARMUP:-$([[ "$MODE" == "editorial" ]] && echo 30 || echo 5)}"
CONCURRENCY="${CONCURRENCY:-$([[ "$MODE" == "editorial" ]] && echo 16 || echo 4)}"

mkdir -p results/matrix

declare -A JAVA_HOMES
JAVA_HOMES[java-21]="${JAVA21_HOME:-${JAVA_21_HOME:-}}"
JAVA_HOMES[java-22]="${JAVA22_HOME:-${JAVA_22_HOME:-}}"
JAVA_HOMES[java-25]="${JAVA25_HOME:-${JAVA_25_HOME:-}}"

for label in java-21 java-22 java-25; do
  java_home="${JAVA_HOMES[$label]}"
  if [[ -z "$java_home" || ! -d "$java_home" ]]; then
    echo "Skipping $label: set ${label/-/_}_HOME or JAVA${label#java-}_HOME to a valid JDK path" >&2
    continue
  fi

  echo "Running matrix entry $label with $java_home"
  args=(--mode "$MODE" --size "$SIZE" --java-home "$java_home" --run-label "$label" --runs "$RUNS" --requests "$REQUESTS" --warmup "$WARMUP" --concurrency "$CONCURRENCY")
  if [[ "$SKIP_BUILD" == "true" ]]; then args+=(--skip-build); fi
  bash scripts/run-lab.sh "${args[@]}"

  cp results/comparison.csv "results/matrix/${label}-${MODE}-comparison.csv"
  cp results/comparison.md "results/matrix/${label}-${MODE}-comparison.md"
  cp results/raw/latest.json "results/matrix/${label}-${MODE}-latest.json"
done

echo "Java matrix completed. See results/matrix."
