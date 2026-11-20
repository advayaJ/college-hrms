import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../../core/audit/audit.service'
import { PermissionRegistry } from '../../core/rbac/registry.service'
import { MODULE_LABELS, PERMISSIONS, ROLE_TEMPLATES } from '../../core/rbac/permissions'
import { SessionUser } from '../../core/auth/auth.types'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../core/http/envelope'

export class UpdateInstitutionDto {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() naacGrade?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() email?: string
  @IsOptional() @IsString() website?: string
  @IsOptional() @IsString() addressLine?: string
}

export class UpdateSettingDto {
  @IsString() key!: string
  value!: unknown
  @IsOptional() @IsString() category?: string
}

export class UpdateStageDto {
  @IsIn(['ANY', 'ALL', 'QUORUM']) strategy!: string
  @IsOptional() @IsInt() minApprovals?: number
  @IsOptional() @IsInt() slaHours?: number
  @IsOptional() @IsString() name?: string
}

export class AssignRoleDto {
  @IsString() email!: string
  @IsString() roleKey!: string
  @IsOptional() @IsString() departmentCode?: string
}

export class UpdateRolePermissionsDto {
  @IsString() roleKey!: string
  permissions!: string[]
}

const DEFAULT_SETTINGS: Record<string, { value: unknown; category: string; label: string }> = {
  'attendance.work_hours': { value: { start: '09:30', end: '17:30', grace: 10 }, category: 'ATTENDANCE', label: 'Working hours & grace' },
  'attendance.late_threshold': { value: { minutes: 20, markHalfDayAfter: 120 }, category: 'ATTENDANCE', label: 'Late arrival rules' },
  'payroll.da_percent': { value: 42, category: 'PAYROLL', label: 'Dearness allowance %' },
  'payroll.hra_percent': { value: 20, category: 'PAYROLL', label: 'HRA %' },
  'payroll.epf_employee_percent': { value: 12, category: 'PAYROLL', label: 'EPF employee share %' },
  'payroll.pt_threshold': { value: 25000, category: 'PAYROLL', label: 'Professional tax threshold' },
  'payroll.disclaimer': { value: 'Demonstration slabs only — verify statutory rates before production use.', category: 'PAYROLL', label: 'Payroll disclaimer' },
  'leave.max_pending_days': { value: 45, category: 'LEAVE', label: 'Auto-escalate pending leave after N days' },
  'notifications.document_expiry_days': { value: 30, category: 'NOTIFICATIONS', label: 'Document expiry lookahead' },
  'security.session_days': { value: 7, category: 'SECURITY', label: 'Session validity' },
  'security.password_policy': { value: 'Min 8 characters; demo accounts use Demo@2026', category: 'SECURITY', label: 'Password policy' },
  'general.email_domain': { value: 'aryavratt.edu.in', category: 'GENERAL', label: 'Official email domain' },
  'general.financial_year': { value: 'April–March', category: 'GENERAL', label: 'Financial year' },
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService, private audit: AuditService, private registry: PermissionRegistry) {}

  async institution(user: SessionUser) {
    return this.prisma.institution.findUnique({ where: { id: user.institutionId }, include: { campuses: true } })
  }

  async updateInstitution(dto: UpdateInstitutionDto, user: SessionUser) {
    await this.prisma.institution.update({ where: { id: user.institutionId }, data: dto })
    await this.audit.record({ userId: user.userId, actorEmail: user.email, action: 'INSTITUTION_UPDATED', module: 'settings', summary: 'Institution profile updated' })
    return { ok: true }
  }

  async settings(user: SessionUser) {
    const rows = await this.prisma.institutionSetting.findMany({ where: { institutionId: user.institutionId } })
    const map = new Map(rows.map((r) => [r.key, r]))
    const keys = [...new Set([...Object.keys(DEFAULT_SETTINGS), ...rows.map((r) => r.key)])]
    return keys.map((key) => {
      const row = map.get(key)
      const def = DEFAULT_SETTINGS[key]
      return {
        key,
        value: row?.value ?? def?.value,
        category: row?.category ?? def?.category ?? 'GENERAL',
        label: def?.label ?? key,
        updatedAt: row?.updatedAt ?? null,
      }
    })
  }

  async updateSetting(dto: UpdateSettingDto, user: SessionUser) {
    const existing = await this.prisma.institutionSetting.findUnique({
      where: { institutionId_key: { institutionId: user.institutionId, key: dto.key } },
    })
    if (existing) {
      await this.prisma.institutionSetting.update({ where: { id: existing.id }, data: { value: dto.value as never, updatedByUserId: user.userId } })
    } else {
      await this.prisma.institutionSetting.create({
        data: { institutionId: user.institutionId, key: dto.key, value: dto.value as never, category: dto.category ?? 'GENERAL', updatedByUserId: user.userId },
      })
    }
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'SETTING_UPDATED', module: 'settings',
      entityType: 'InstitutionSetting', entityId: dto.key, summary: `Setting "${dto.key}" updated`,
    })
    return { ok: true }
  }

  // ── workflows ───────────────────────────────────────────────────────

  async workflows(user: SessionUser) {
    const rows = await this.prisma.approvalWorkflow.findMany({
      where: { institutionId: user.institutionId },
      include: { stages: { orderBy: { seq: 'asc' }, include: { approverRole: true, approverUser: { select: { email: true, employee: { select: { fullName: true } } } } } } },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map((w) => ({
      id: w.id,
      name: w.name,
      docType: w.docType,
      description: w.description,
      isActive: w.isActive,
      isDefault: w.isDefault,
      stages: w.stages.map((s) => ({
        id: s.id,
        seq: s.seq,
        name: s.name,
        approverType: s.approverType,
        approverRole: s.approverRole ? { key: s.approverRole.key, name: s.approverRole.name } : null,
        approverUser: s.approverUser ? { email: s.approverUser.email, name: s.approverUser.employee?.fullName } : null,
        strategy: s.strategy,
        minApprovals: s.minApprovals,
        slaHours: s.slaHours,
        isFinal: s.isFinal,
      })),
    }))
  }

  async updateStage(stageId: string, dto: UpdateStageDto, user: SessionUser) {
    const stage = await this.prisma.approvalStage.findUnique({ where: { id: stageId }, include: { workflow: true } })
    if (!stage || stage.workflow.institutionId !== user.institutionId) throw new NotFoundError('Stage not found')
    await this.prisma.approvalStage.update({
      where: { id: stageId },
      data: {
        name: dto.name ?? stage.name,
        strategy: dto.strategy as never,
        minApprovals: dto.minApprovals ?? stage.minApprovals,
        slaHours: dto.slaHours ?? stage.slaHours,
      },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'WORKFLOW_STAGE_UPDATED', module: 'settings',
      entityType: 'ApprovalStage', entityId: stageId,
      summary: `Stage "${dto.name ?? stage.name}" set to ${dto.strategy}${dto.minApprovals ? ` (min ${dto.minApprovals})` : ''}`,
    })
    return { ok: true }
  }

  async setWorkflowActive(workflowId: string, active: boolean, user: SessionUser) {
    const wf = await this.prisma.approvalWorkflow.findUnique({ where: { id: workflowId } })
    if (!wf || wf.institutionId !== user.institutionId) throw new NotFoundError('Workflow not found')
    await this.prisma.approvalWorkflow.update({ where: { id: workflowId }, data: { isActive: active } })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'WORKFLOW_UPDATED', module: 'settings',
      entityType: 'ApprovalWorkflow', entityId: workflowId, summary: `Workflow "${wf.name}" ${active ? 'activated' : 'deactivated'}`,
    })
    return { ok: true }
  }

  // ── users & roles ───────────────────────────────────────────────────

  async users(user: SessionUser, q?: string, page = 1) {
    const where: Prisma.UserWhereInput = {}
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { employee: { fullName: { contains: q, mode: 'insensitive' } } },
        { employee: { employeeCode: { contains: q.toUpperCase() } } },
      ]
    }
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          employee: { select: { employeeCode: true, fullName: true, photoSeed: true, designation: { select: { title: true } } } },
          userRoles: { include: { role: true, department: true } },
        },
        orderBy: { email: 'asc' },
        skip: (page - 1) * 25,
        take: 25,
      }),
    ])
    return {
      total, page,
      items: rows.map((u) => ({
        id: u.id,
        email: u.email,
        status: u.status,
        isDemo: u.isDemo,
        lastLoginAt: u.lastLoginAt,
        employee: u.employee,
        roles: u.userRoles.map((r) => ({ key: r.role.key, name: r.role.name, department: r.department?.name ?? null })),
      })),
    }
  }

  async assignRole(dto: AssignRoleDto, user: SessionUser) {
    const target = await this.prisma.user.findUnique({ where: { email: dto.email }, include: { userRoles: true } })
    if (!target) throw new NotFoundError('User not found')
    const role = await this.prisma.role.findUnique({ where: { key: dto.roleKey } })
    if (!role) throw new NotFoundError('Role not found')
    let departmentId: string | null = null
    if (dto.departmentCode) {
      const dept = await this.prisma.department.findUnique({ where: { code: dto.departmentCode } })
      if (!dept) throw new NotFoundError('Department not found')
      departmentId = dept.id
    }
    const existing = target.userRoles.find(
      (r) => r.roleId === role.id && (r.departmentId ?? null) === (departmentId ?? null)
    )
    if (existing) throw new BadRequestError('User already holds this role assignment')
    await this.prisma.userRole.create({ data: { userId: target.id, roleId: role.id, departmentId } })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'ROLE_ASSIGNED', module: 'settings',
      entityType: 'User', entityId: target.id,
      summary: `Role ${role.key}${departmentId ? ` (dept-scoped)` : ''} assigned to ${dto.email}`,
    })
    this.registry.invalidate(role.key)
    return { ok: true }
  }

  async removeRole(userId: string, roleKey: string, user: SessionUser) {
    const ur = await this.prisma.userRole.findFirst({
      where: { userId, role: { key: roleKey } },
      include: { role: true },
    })
    if (!ur) throw new NotFoundError('Assignment not found')
    await this.prisma.userRole.delete({ where: { id: ur.id } })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'ROLE_REMOVED', module: 'settings',
      entityType: 'User', entityId: userId, summary: `Role ${roleKey} removed from user`,
    })
    this.registry.invalidate(roleKey)
    return { ok: true }
  }

  async setUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED', user: SessionUser) {
    if (userId === user.userId) throw new BadRequestError('You cannot suspend your own account')
    await this.prisma.user.update({ where: { id: userId }, data: { status } })
    if (status === 'SUSPENDED') {
      await this.prisma.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })
    }
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'USER_STATUS_CHANGED', module: 'settings',
      entityType: 'User', entityId: userId, summary: `User set to ${status}`,
    })
    return { ok: true }
  }

  async resetPassword(userId: string, user: SessionUser) {
    const { hash } = await import('bcryptjs')
    const temp = `Hrms@${Math.random().toString(36).slice(2, 8)}`
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await hash(temp, 10) } })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'PASSWORD_RESET', module: 'settings',
      entityType: 'User', entityId: userId, summary: 'Password reset (temporary password issued)',
    })
    return { temporaryPassword: temp }
  }

  async roles(user: SessionUser) {
    const roles = await this.prisma.role.findMany({
      include: { _count: { select: { userRoles: true, permissions: true } }, permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    })
    const allPermissions = PERMISSIONS.map((p) => ({ key: p.key, module: p.module, action: p.action, description: p.description }))
    return {
      roles: roles.map((r) => ({
        key: r.key,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
        scope: r.scope,
        userCount: r._count.userRoles,
        permissionCount: r._count.permissions,
        permissions: r.permissions.map((p) => p.permission.key),
      })),
      allPermissions,
      modules: MODULE_LABELS,
    }
  }

  async updateRolePermissions(dto: UpdateRolePermissionsDto, user: SessionUser) {
    const role = await this.prisma.role.findUnique({ where: { key: dto.roleKey } })
    if (!role) throw new NotFoundError('Role not found')
    const valid = new Set(PERMISSIONS.map((p) => p.key))
    const perms = [...new Set(dto.permissions)].filter((p) => valid.has(p))
    // ensure the permission registry rows exist, then map to their ids
    await this.prisma.permission.createMany({
      data: PERMISSIONS.map((p) => ({ key: p.key, module: p.module, action: p.action, description: p.description })),
      skipDuplicates: true,
    })
    const rows = perms.length ? await this.prisma.permission.findMany({ where: { key: { in: perms } } }) : []
    await this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    if (rows.length) {
      await this.prisma.rolePermission.createMany({
        data: rows.map((r) => ({ roleId: role.id, permissionId: r.id })),
        skipDuplicates: true,
      })
    }
    this.registry.invalidate(role.key)
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'ROLE_PERMISSIONS_UPDATED', module: 'settings',
      entityType: 'Role', entityId: role.key, summary: `Role ${role.key} now grants ${perms.length} permissions`,
    })
    return { ok: true, permissionCount: perms.length }
  }

  // ── audit ───────────────────────────────────────────────────────────

  async auditLog(user: SessionUser, module?: string, q?: string, page = 1) {
    const where: Prisma.AuditLogWhereInput = {}
    if (module) where.module = module
    if (q) {
      where.OR = [
        { summary: { contains: q, mode: 'insensitive' } },
        { actorEmail: { contains: q, mode: 'insensitive' } },
        { action: { contains: q.toUpperCase() } },
      ]
    }
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 30,
        take: 30,
      }),
    ])
    return {
      total, page,
      items: rows.map((r) => ({
        id: r.id, action: r.action, module: r.module, summary: r.summary,
        actorEmail: r.actorEmail, entityType: r.entityType, entityId: r.entityId,
        createdAt: r.createdAt,
      })),
    }
  }
}
