import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"

/**
 * Node-only boot hook: guarantees the embedded PostgreSQL server is up when
 * the Next server starts (idempotent — exits quietly if already serving).
 */
const ensurePg = path.join(process.cwd(), "mini-services", "hrms-api", "scripts", "ensure-pg.mjs")
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
