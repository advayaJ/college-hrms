// Systematic multi-role switch test:
// for every user holding >1 distinct role, log in, switch through each role,
// and verify /dashboard reflects the new role with a pictorial chart.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { Client } = require('/home/z/my-project/mini-services/hrms-api/node_modules/pg')

const BASE = 'http://localhost:81/api/v1'
const Q = 'XTransformPort=3001'
const PASS = 'Demo@2026'

async function api(path, opts = {}, cookie) {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}${Q}`
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...(opts.headers ?? {}),
    },
  })
  let body = null
  try { body = await res.json() } catch {}
  return { status: res.status, body, cookie: res.headers.get('set-cookie') }
}

async function main() {
  const c = new Client({ connectionString: 'postgresql://postgres:hrms_pg_2026@127.0.0.1:5432/hrms' })
  await c.connect()
  const r = await c.query(
    'SELECT u.email, r.key AS rk, ur."departmentId" AS dept FROM "User" u ' +
    'JOIN "UserRole" ur ON ur."userId"=u.id JOIN "Role" r ON r.id=ur."roleId" ORDER BY u.email, r.key'
  )
  await c.end()

  const byUser = {}
  for (const row of r.rows) {
    (byUser[row.email] ??= []).push({ key: row.rk, departmentId: row.dept })
  }
  // collapse identical (key, dept) seed artifacts; keep users with >1 distinct choice
  const users = {}
  for (const [email, roles] of Object.entries(byUser)) {
    const seen = new Set()
    const uniq = roles.filter((x) => {
      const id = `${x.key}:${x.departmentId ?? ''}`
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
    if (uniq.length > 1) users[email] = uniq
  }
  console.log(`users with >1 distinct role: ${Object.keys(users).length}\n`)

  let failed = 0
  let checked = 0

  for (const [email, roles] of Object.entries(users)) {
    const login = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: PASS }) })
    if (!(login.status >= 200 && login.status < 300) || !login.body?.ok) {
      console.log(`FAIL login ${email} [${login.status}]`)
      failed++
      continue
    }
    let cookie = login.cookie.split(';')[0]
    for (const target of roles) {
      const sw = await api(
        '/auth/switch-role',
        { method: 'POST', body: JSON.stringify({ roleKey: target.key, departmentId: target.departmentId ?? undefined }) },
        cookie
      )
      if (!(sw.status >= 200 && sw.status < 300) || !sw.body?.ok) {
        console.log(`FAIL switch ${email} -> ${target.key} [${sw.status}] ${JSON.stringify(sw.body?.error ?? '')}`)
        failed++
        continue
      }
      cookie = sw.cookie.split(';')[0]
      checked++

      const activeOk = sw.body.data.activeRoleKey === target.key
      const dash = await api('/dashboard', {}, cookie)
      const roleReflects = dash.body?.ok === true && dash.body.data?.roleKey === target.key
      const charts = dash.body?.data?.charts ?? {}
      const hasPictorial = Object.values(charts).some((v) =>
        Array.isArray(v) ? v.length > 0 : v && Object.keys(v).length > 0
      )
      const ok = activeOk && dash.status === 200 && roleReflects && hasPictorial
      if (!ok) failed++
      console.log(
        `${ok ? 'OK  ' : 'FAIL'} ${email} -> ${target.key}${target.departmentId ? '+dept' : ''} ` +
        `active=${activeOk ? 'Y' : 'N'} dash=${dash.status} role=${dash.body?.data?.roleKey ?? '?'} pictorial=${hasPictorial ? 'Y' : 'N'}`
      )
    }
  }

  console.log(`\n${checked} switches checked, ${failed} failures`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => { console.error('ERROR', e.message); process.exit(1) })
