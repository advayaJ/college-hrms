"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scopeFor = scopeFor;
exports.deptIdsOf = deptIdsOf;
function scopeFor(user, allPerm, deptPerm, selfPerm) {
    if (user.permissions.includes(allPerm))
        return { kind: 'ALL' };
    if (user.permissions.includes(deptPerm)) {
        const deptIds = [];
        for (const r of user.roles) {
            if (r.key === user.activeRoleKey && r.departmentId)
                deptIds.push(r.departmentId);
        }
        if (user.activeDepartmentId && !deptIds.includes(user.activeDepartmentId)) {
            deptIds.push(user.activeDepartmentId);
        }
        if (deptIds.length > 0)
            return { kind: 'DEPT', departmentIds: deptIds };
    }
    return { kind: 'SELF', employeeId: user.employeeId };
}
function deptIdsOf(user) {
    const ids = [];
    for (const r of user.roles)
        if (r.departmentId)
            ids.push(r.departmentId);
    if (user.activeDepartmentId && !ids.includes(user.activeDepartmentId))
        ids.push(user.activeDepartmentId);
    return [...new Set(ids)];
}
//# sourceMappingURL=scope.js.map