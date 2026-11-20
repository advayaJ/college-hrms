#!/bin/bash
# daemon-launch.sh — start the hrms-api dev service fully detached.
#
# The sandbox tool shell reaps its whole descendant tree when a command
# finishes, so a plain `nohup ... &` (or single setsid where the parent
# keeps waiting) gets killed. The classic double-fork below orphans the
# service instantly (PPID -> 1, own session) — the only pattern that
# survives, same trick pg_ctl uses for postgres.
#
# Usage: bash scripts/daemon-launch.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p ../../nest-dev.log.touch 2>/dev/null || true
LOG="${NEST_LOG:-/home/z/my-project/nest-dev.log}"
( setsid bash scripts/dev.sh >> "$LOG" 2>&1 < /dev/null & )
echo "[daemon-launch] hrms-api launched detached (log: $LOG)"
