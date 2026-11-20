import { SessionUser } from '../core/auth/auth.types'

export type AccessScope =
  | { kind: 'ALL' }
  | { kind: 'DEPT'; departmentIds: string[] }
  | { kind: 'SELF'; employeeId: string }

/**
 * Determine the data-access scope for the session based on held permissions.
 * Used by services to narrow queries (institution vs department vs self).
 */
export function scopeFor(user: SessionUser, allPerm: string, deptPerm: string, selfPerm: string): AccessScope {
  if (user.permissions.includes(allPerm)) return { kind: 'ALL' }
  if (user.permissions.includes(deptPerm)) {
    const deptIds: string[] = []
    for (const r of user.roles) {
      if (r.key === user.activeRoleKey && r.departmentId) deptIds.push(r.departmentId)
    }
    if (user.activeDepartmentId && !deptIds.includes(user.activeDepartmentId)) {
      deptIds.push(user.activeDepartmentId)
    }
    if (deptIds.length > 0) return { kind: 'DEPT', departmentIds: deptIds }
  }
  return { kind: 'SELF', employeeId: user.employeeId }
}

export function deptIdsOf(user: SessionUser): string[] {
  const ids: string[] = []
  for (const r of user.roles) if (r.departmentId) ids.push(r.departmentId)
  if (user.activeDepartmentId && !ids.includes(user.activeDepartmentId)) ids.push(user.activeDepartmentId)
  return [...new Set(ids)]
}
