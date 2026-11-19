#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh
node scripts/ensure-pg.mjs
exec ./node_modules/.bin/prisma db push --accept-data-loss "$@"
