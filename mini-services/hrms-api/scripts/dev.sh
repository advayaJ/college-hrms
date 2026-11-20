#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

# Start PostgreSQL (idempotent)
node scripts/ensure-pg.mjs

# Reinstalling node_modules (sandbox recycle) wipes the generated Prisma
# client, so every model delegate disappears. Regenerate whenever missing.
if [ ! -f node_modules/.prisma/client/libquery_engine.so ] && [ ! -f node_modules/.prisma/client/schema.prisma ]; then
  echo "[dev] generated prisma client missing — running prisma generate"
  ./node_modules/.bin/prisma generate
fi

if [ "${1:-}" = "--prod" ]; then
  exec node dist/main.js
else
  exec ./node_modules/.bin/nest start --watch
fi
