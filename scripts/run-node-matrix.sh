#!/usr/bin/env bash
set -euo pipefail

MODE="smoke"
SIZE="small"
JAVA_HOME_ARG="${JAVA_HOME:-}"
RUNS=""
REQUESTS=""
WARMUP=""
CONCURRENCY=""
SKIP_BUILD="false"
VERSIONS="${NODE_MATRIX_VERSIONS:-20.18.0 22.17.1 24.11.1 25.2.1}"
RESTORE_VERSION="${NODE_MATRIX_RESTORE:-24.11.1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --size) SIZE="$2"; shift 2 ;;
    --java-home) JAVA_HOME_ARG="$2"; shift 2 ;;
    --runs) RUNS="$2"; shift 2 ;;
    --requests) REQUESTS="$2"; shift 2 ;;
    --warmup) WARMUP="$2"; shift 2 ;;
    --concurrency) CONCURRENCY="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD="true"; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if ! command -v nvm >/dev/null 2>&1; then
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    source "$HOME/.nvm/nvm.sh"
  else
    echo "nvm is required for Node matrix on Bash" >&2
    exit 1
  fi
fi

RUNS="${RUNS:-$([[ "$MODE" == "editorial" ]] && echo 3 || echo 1)}"
REQUESTS="${REQUESTS:-$([[ "$MODE" == "editorial" ]] && echo 300 || echo 20)}"
WARMUP="${WARMUP:-$([[ "$MODE" == "editorial" ]] && echo 30 || echo 5)}"
CONCURRENCY="${CONCURRENCY:-$([[ "$MODE" == "editorial" ]] && echo 16 || echo 4)}"

mkdir -p results/matrix

restore_node() {
  nvm use "$RESTORE_VERSION" >/dev/null 2>&1 || true
}
trap restore_node EXIT

for version in $VERSIONS; do
  echo "Running Node matrix entry node-$version"
  nvm use "$version"
  args=(--mode "$MODE" --size "$SIZE" --run-label "node-$version" --runs "$RUNS" --requests "$REQUESTS" --warmup "$WARMUP" --concurrency "$CONCURRENCY")
  if [[ -n "$JAVA_HOME_ARG" ]]; then args+=(--java-home "$JAVA_HOME_ARG"); fi
  if [[ "$SKIP_BUILD" == "true" ]]; then args+=(--skip-build); fi
  bash scripts/run-lab.sh "${args[@]}"

  cp results/comparison.csv "results/matrix/node-${version}-${MODE}-comparison.csv"
  cp results/comparison.md "results/matrix/node-${version}-${MODE}-comparison.md"
  cp results/raw/latest.json "results/matrix/node-${version}-${MODE}-latest.json"
done

echo "Node matrix completed. See results/matrix."
