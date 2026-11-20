#!/bin/bash
# serve.sh — frontend entry used by the platform supervisor (`bun run dev`).
#
# Prefers the prebuilt production bundle when one exists: the standalone
# server holds ~100 MB RSS, whereas `next dev` (Turbopack) balloons past
# 1.9 GB and has repeatedly been OOM-killed on this 4 GB box, taking the
# preview down. Falls back to the classic dev server (with a JS heap cap)
# when no build is present.
#
# After changing frontend code: run `bun run build` to refresh the bundle,
# or delete `.next/standalone` to fall back to hot-reload dev mode.
cd "$(dirname "$0")/.."

# Self-heal: if a stale server from a previous build still holds :3000 (the
# classic EADDRINUSE crash after `bun run build` + restart), kill it so this
# instance can bind and serve the CURRENT build's chunks.
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp >/dev/null 2>&1 || true
  sleep 1
elif command -v ss >/dev/null 2>&1 && ss -tlnp 2>/dev/null | grep -q ':3000 '; then
  PID=$(ss -tlnp 2>/dev/null | grep ':3000 ' | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2)
  [ -n "$PID" ] && kill "$PID" 2>/dev/null || true
  sleep 1
fi

if [ -f .next/standalone/server.js ]; then
  echo "[serve] production bundle found — serving .next/standalone on :3000"
  exec bun .next/standalone/server.js
fi

echo "[serve] no production bundle — starting next dev on :3000"
exec env NODE_OPTIONS=--max-old-space-size=1280 ./node_modules/.bin/next dev -p 3000
