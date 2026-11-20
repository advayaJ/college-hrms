/**
 * restore-accountant-role.mjs — restores the ACCOUNTANT role to its
 * template permissions from src/core/rbac/permissions.ts via the
 * settings API (PUT /settings/roles/permissions) so the audit trail
 * is written and the runtime RBAC registry cache is invalidated.
 *
 * Usage: node scripts/restore-accountant-role.mjs [superadmin-email]
 */
const BASE = 'http://127.0.0.1:3001/api/v1'
const EMAIL = process.argv[2] || 'superadmin@aryavratt.edu.in'
const PASSWORD = 'Demo@2026'

// ROLE_TEMPLATES[ACCOUNTANT].permissions — single source of truth: src/core/rbac/permissions.ts
const ACCOUNTANT_TEMPLATE = [
  'dashboard:view',
  'employees:read_all',
  'departments:read',
  'attendance:read_all',
  'leave:read_all',
  'payroll:read_all',
  'payroll:process',
  'payroll:read_reports',
  'reports:read',
  'reports:export',
  'settings:read',
]

const login = await fetch(`${BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})
if (!login.ok) {
  console.error(`login failed: HTTP ${login.status}`, (await login.text()).slice(0, 200))
  process.exit(1)
}
const cookie = login.headers.get('set-cookie')?.split(';')[0] || ''
const loginJson = await login.json()
console.log(`[restore] logged in as ${loginJson?.data?.user?.email} (${loginJson?.data?.user?.primaryRole || ''})`)

const put = await fetch(`${BASE}/settings/roles/permissions`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Cookie: cookie },
  body: JSON.stringify({ roleKey: 'ACCOUNTANT', permissions: ACCOUNTANT_TEMPLATE }),
})
const putText = await put.text()
if (!put.ok) {
  console.error(`restore failed: HTTP ${put.status}`, putText.slice(0, 300))
  process.exit(1)
}
console.log(`[restore] PUT result: ${putText}`)

// Verify through the API the UI itself uses
const check = await fetch(`${BASE}/settings/roles`, { headers: { Cookie: cookie } })
const roles = await check.json()
const acc = roles?.data?.roles?.find((r) => r.key === 'ACCOUNTANT') || roles?.data?.find?.((r) => r.key === 'ACCOUNTANT')
if (acc) {
  const perms = acc.permissions?.map((p) => p.key || p) || []
  console.log(`[restore] ACCOUNTANT now has ${perms.length} permissions:`)
  perms.forEach((k) => console.log(`  - ${k}`))
  const missing = ACCOUNTANT_TEMPLATE.filter((k) => !perms.includes(k))
  console.log(missing.length ? `[restore] MISSING: ${missing.join(', ')}` : '[restore] ✓ template fully restored')
} else {
  console.log('[restore] (could not read roles payload for verification — check via UI)')
}
