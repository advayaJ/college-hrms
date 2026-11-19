/**
 * ensure-pg.mjs — Idempotent PostgreSQL provisioner.
 * Drives the embedded-postgres binaries directly (initdb + pg_ctl) so the
 * cluster lives in /home/z/my-project/db-pg and persists across sessions.
 * Auth is `trust` on loopback only; the sandbox exposes no other route.
 * Safe to run concurrently: exits quietly when the port is already serving.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import net from 'node:net'

const SERVICE_DIR = process.cwd()
const ROOT = path.resolve(SERVICE_DIR, '../..')
const PORT = Number(process.env.PG_PORT || 5432)
const USER = process.env.PG_USER || 'postgres'
const PASSWORD = process.env.PG_PASSWORD || 'hrms_pg_2026'
const DATABASE = process.env.PG_DATABASE || 'hrms'
const DATA_DIR = process.env.PGDATA_DIR || path.join(ROOT, 'db-pg', 'data')
const LOG_FILE = path.join(ROOT, 'db-pg', 'server.log')
const BIN = path.join(SERVICE_DIR, 'node_modules', '@embedded-postgres', 'linux-x64', 'native', 'bin')

const log = (m) => console.log(`[ensure-pg] ${m}`)
const run = (bin, args) =>
  spawnSync(path.join(BIN, bin), args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, LC_ALL: 'C.UTF-8' } })

function portOpen(port) {
  return new Promise((resolve) => {
    let settled = false
    const s = net.connect({ port, host: '127.0.0.1' }, () => { settled = true; s.destroy(); resolve(true) })
    s.on('error', () => { if (!settled) { settled = true; resolve(false) } })
    setTimeout(() => { if (!settled) { settled = true; try { s.destroy() } catch {} ; resolve(false) } }, 2000)
  })
}

async function main() {
  if (!existsSync(path.join(BIN, 'pg_ctl'))) {
    log('postgres binaries not installed yet — skipping (bun install has not run)')
    return 0
  }
  if (await portOpen(PORT)) {
    log(`PostgreSQL already serving on 127.0.0.1:${PORT}`)
  } else {
    if (!existsSync(path.join(DATA_DIR, 'PG_VERSION'))) {
      log(`initialising cluster at ${DATA_DIR}`)
      const res = run('initdb', ['-D', DATA_DIR, '-U', USER, '--auth=trust', '-E', 'UTF8'])
      if (res.status !== 0) {
        log(`initdb failed: ${(res.stderr || res.stdout || '').toString().slice(-400)}`)
        return 1
      }
      log('initdb completed')
    }
    log(`starting postgres (log: ${LOG_FILE})`)
    const res = run('pg_ctl', ['-D', DATA_DIR, '-l', LOG_FILE, '-w', '-t', '60', 'start'])
    if (res.status !== 0) {
      if (await portOpen(PORT)) log('server is up despite pg_ctl exit code')
      else {
        log(`pg_ctl failed: ${(res.stderr || res.stdout || '').toString().slice(-400)}`)
        return 1
      }
    }
    for (let i = 0; i < 30 && !(await portOpen(PORT)); i++) {
      await new Promise((r) => setTimeout(r, 400))
    }
    if (!(await portOpen(PORT))) {
      log('PostgreSQL did not become ready')
      return 1
    }
    log('PostgreSQL is ready')
  }

  try {
    const { Client } = await import('pg')
    const c = new Client({ connectionString: `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/postgres` })
    await c.connect()
    const { rows } = await c.query('SELECT 1 AS ok FROM pg_database WHERE datname = $1', [DATABASE])
    if (rows.length === 0) {
      await c.query(`CREATE DATABASE "${DATABASE}"`)
      log(`database "${DATABASE}" created`)
    } else {
      log(`database "${DATABASE}" present`)
    }
    await c.end()
  } catch (err) {
    log(`db check error (non-fatal): ${err.message}`)
  }
  return 0
}

process.exit(await main())
