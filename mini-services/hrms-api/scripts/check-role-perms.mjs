/**
 * check-role-perms.mjs — inspect RolePermission counts per role,
 * and list the ACCOUNTANT role's current permissions.
 */
import { Client } from 'pg'

const c = new Client({ connectionString: 'postgresql://postgres:hrms_pg_2026@127.0.0.1:5432/hrms' })
await c.connect()

const counts = await c.query(`
  SELECT r.key, r.name, COUNT(rp."permissionId")::int AS perm_count
  FROM "Role" r LEFT JOIN "RolePermission" rp ON rp."roleId" = r.id
  GROUP BY r.key, r.name ORDER BY r.key`)
console.log('=== permission count per role ===')
for (const row of counts.rows) console.log(`${row.key.padEnd(20)} ${String(row.perm_count).padStart(3)}  ${row.name}`)

const acc = await c.query(`
  SELECT p.key
  FROM "Role" r
  JOIN "RolePermission" rp ON rp."roleId" = r.id
  JOIN "Permission" p ON p.id = rp."permissionId"
  WHERE r.key = 'ACCOUNTANT' ORDER BY p.key`)
console.log('=== ACCOUNTANT current permissions ===')
console.log(acc.rows.length ? acc.rows.map((r) => r.key).join('\n') : '(none — all permissions were removed)')

const totalPerms = await c.query(`SELECT COUNT(*)::int AS n FROM "Permission"`)
console.log(`=== registry total: ${totalPerms.rows[0].n} permissions ===`)

await c.end()
