import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"

/**
 * Node-only boot hook: guarantees the embedded PostgreSQL server is up when
 * the Next server starts (idempotent — exits quietly if already serving).
 *
 * NOTE: the script path is assembled through a runtime `reduce` on purpose —
 * bundlers (Turbopack) statically trace plain `path.join(...)` spawn arguments
 * and fail the production build resolving them as modules. Keep it opaque.
 */
const PG_SCRIPT_SEGMENTS = ["mini-services", "hrms-api", "scripts", "ensure-pg.mjs"]
const ensurePg = PG_SCRIPT_SEGMENTS.reduce<string>((acc, seg) => path.join(acc, seg), process.cwd())
if (existsSync(ensurePg)) {
  try {
    const child = spawn("node", [ensurePg], {
      cwd: path.dirname(ensurePg),
      detached: true,
      stdio: "ignore",
      env: { ...process.env, PG_PORT: process.env.PG_PORT || "5432" },
    })
    child.unref()
  } catch {
    // never block the web server boot on infra checks
  }
}
