#!/usr/bin/env bash
set -euo pipefail

MODE="smoke"
SIZE="small"
JAVA_HOME_ARG=""
RUN_LABEL=""
RUNS=""
REQUESTS=""
WARMUP=""
CONCURRENCY=""
SKIP_BUILD="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --size) SIZE="$2"; shift 2 ;;
    --java-home) JAVA_HOME_ARG="$2"; shift 2 ;;
    --run-label) RUN_LABEL="$2"; shift 2 ;;
    --runs) RUNS="$2"; shift 2 ;;
    --requests) REQUESTS="$2"; shift 2 ;;
    --warmup) WARMUP="$2"; shift 2 ;;
    --concurrency) CONCURRENCY="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD="true"; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

case "$MODE" in smoke|editorial) ;; *) echo "Invalid mode: $MODE" >&2; exit 2 ;; esac
case "$SIZE" in small|medium|editorial|large) ;; *) echo "Invalid size: $SIZE" >&2; exit 2 ;; esac

if [[ -n "$JAVA_HOME_ARG" ]]; then
  export JAVA_HOME="$JAVA_HOME_ARG"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

RUNS="${RUNS:-$([[ "$MODE" == "editorial" ]] && echo 3 || echo 1)}"
REQUESTS="${REQUESTS:-$([[ "$MODE" == "editorial" ]] && echo 300 || echo 20)}"
WARMUP="${WARMUP:-$([[ "$MODE" == "editorial" ]] && echo 30 || echo 5)}"
CONCURRENCY="${CONCURRENCY:-$([[ "$MODE" == "editorial" ]] && echo 16 || echo 4)}"

DB_PORT="${LAB_DB_PORT:-55432}"
PRISMA_PORT="${LAB_PRISMA_PORT:-3101}"
JDBC_PORT="${LAB_JDBC_PORT:-3102}"

mkdir -p results/raw
rm -f results/comparison.csv results/comparison.md results/raw/latest.json

docker compose up -d postgres
docker compose config --quiet

if [[ "$SKIP_BUILD" != "true" ]]; then
  pushd apps/prisma-client >/dev/null
  pnpm install
  npx prisma generate
  pnpm build
  pnpm test
  popd >/dev/null

  pushd apps/jdbc-service >/dev/null
  mvn test
  mvn package
  popd >/dev/null
fi

bash scripts/seed.sh "$SIZE"

export DATABASE_URL="postgresql://lab:lab@localhost:${DB_PORT}/lab?schema=public"
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:${DB_PORT}/lab"
export SPRING_DATASOURCE_USERNAME="lab"
export SPRING_DATASOURCE_PASSWORD="lab"
export SERVER_PORT="$JDBC_PORT"
export PORT="$PRISMA_PORT"
export PRISMA_URL="http://127.0.0.1:${PRISMA_PORT}"
export JDBC_URL="http://127.0.0.1:${JDBC_PORT}"
export JAVA_TOOL_OPTIONS="-Duser.timezone=UTC"

cleanup() {
  if [[ -n "${PRISMA_PID:-}" ]]; then kill "$PRISMA_PID" 2>/dev/null || true; fi
  if [[ -n "${JDBC_PID:-}" ]]; then kill "$JDBC_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

(cd apps/prisma-client && node dist/server.js > ../../results/raw/prisma.out.log 2> ../../results/raw/prisma.err.log) &
PRISMA_PID=$!
(cd apps/jdbc-service && java -jar target/jdbc-service-1.0.0.jar > ../../results/raw/jdbc.out.log 2> ../../results/raw/jdbc.err.log) &
JDBC_PID=$!

for url in "$PRISMA_URL/health" "$JDBC_URL/health"; do
  ready="false"
  for _ in $(seq 1 60); do
    if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
      ready="true"
      break
    fi
    sleep 1
  done
  if [[ "$ready" != "true" ]]; then
    echo "Service did not become ready: $url" >&2
    exit 1
  fi
done

node scripts/smoke-endpoints.mjs

export LAB_MODE="$MODE"
export LAB_RUNS="$RUNS"
export LAB_REQUESTS="$REQUESTS"
export LAB_WARMUP="$WARMUP"
export LAB_CONCURRENCY="$CONCURRENCY"
if [[ -n "$RUN_LABEL" ]]; then export LAB_RUN_LABEL="$RUN_LABEL"; fi

node scripts/runner.mjs
node scripts/verify-results.mjs --input results/raw/latest.json --require-editorial "$([[ "$MODE" == "editorial" ]] && echo true || echo false)"
bash scripts/compare-results.sh
