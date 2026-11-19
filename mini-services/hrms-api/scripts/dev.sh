#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

# Start PostgreSQL (idempotent)
node scripts/ensure-pg.mjs

if [ "${1:-}" = "--prod" ]; then
  exec node dist/main.js
else
  exec ./node_modules/.bin/nest start --watch
fi
