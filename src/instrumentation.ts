/**
 * Next.js instrumentation — safety net for the PostgreSQL server.
 * Primary supervisor: .zscripts/dev.sh auto-starts mini-services (incl. hrms-api).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node")
  }
}
