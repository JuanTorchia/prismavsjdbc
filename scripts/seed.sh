#!/usr/bin/env bash
set -euo pipefail

SIZE="${1:-small}"
case "$SIZE" in
  small|medium|editorial|large) ;;
  *) echo "Invalid size: $SIZE" >&2; exit 2 ;;
esac

DB_PORT="${LAB_DB_PORT:-55432}"
export DATABASE_URL="${DATABASE_URL:-postgresql://lab:lab@localhost:${DB_PORT}/lab?schema=public}"
export LAB_SIZE="$SIZE"

pushd apps/prisma-client >/dev/null
npx prisma db push
pnpm seed
popd >/dev/null
