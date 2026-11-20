#!/bin/bash
# frontend-daemon-launch.sh — start the Next.js frontend fully detached.
#
# The sandbox tool shell reaps its whole descendant tree when a command
# finishes, so a plain `nohup ... &` gets killed. The classic double-fork
# below orphans the service instantly (PPID -> 1, own session) — the only
# pattern that survives (same trick as mini-services/hrms-api daemon-launch.sh).
#
# Usage: bash scripts/frontend-daemon-launch.sh
set -euo pipefail
cd "$(dirname "$0")/.."
LOG="${FRONTEND_LOG:-/home/z/my-project/dev.log}"
( setsid bash scripts/serve.sh >> "$LOG" 2>&1 < /dev/null & )
echo "[frontend-daemon-launch] Next.js frontend launched detached (log: $LOG)"
