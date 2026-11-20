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

if [ -f .next/standalone/server.js ]; then
  echo "[serve] production bundle found — serving .next/standalone on :3000"
  exec bun .next/standalone/server.js
fi

echo "[serve] no production bundle — starting next dev on :3000"
exec env NODE_OPTIONS=--max-old-space-size=1280 ./node_modules/.bin/next dev -p 3000
