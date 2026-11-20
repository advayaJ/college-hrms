import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../../core/audit/audit.service'
import { PermissionRegistry } from '../../core/rbac/registry.service'
import { AUTH_COOKIE, JwtPayload, SessionUser } from '../../core/auth/auth.types'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../core/http/envelope'

export interface SessionView {
  user: {
    id: string
    email: string
    name: string
    employeeId: string
    employeeCode: string
    designationTitle: string | null
    departmentId: string | null
    departmentName: string | null
    campusId: string | null
    photoSeed: number
  }
  institution: { id: string; name: string; code: string; type: string }
  campuses: { id: string; name: string; code: string; isMain: boolean }[]
  roles: { key: string; name: string; departmentId: string | null; departmentName: string | null }[]
  activeRoleKey: string
  permissions: string[]
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private registry: PermissionRegistry,
    private audit: AuditService
  ) {}

  async login(email: string, password: string, ip?: string, deviceLabel?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        employee: { include: { department: true, designation: true } },
        userRoles: { include: { role: true, department: true } },
      },
    })
    if (!user || !user.employee) throw new UnauthorizedError('Invalid email or password')
    if (user.status !== 'ACTIVE') throw new UnauthorizedError('Account is ' + user.status.toLowerCase())

    const { compare } = await import('bcryptjs')
    const valid = await compare(password, user.passwordHash)
    if (!valid) {
      await this.prisma.user.update({ where: { id: user.id }, data: { failedAttempts: { increment: 1 } } })
      throw new UnauthorizedError('Invalid email or password')
    }

    const roles = user.userRoles.map((ur) => ({
      key: ur.role.key,
      departmentId: ur.departmentId,
    }))
    const priority = ['SUPER_ADMIN', 'PRINCIPAL', 'HR_ADMIN', 'ACCOUNTANT', 'HOD', 'FACULTY', 'NON_TEACHING_STAFF', 'TECHNICAL_STAFF']
    const preferred = (() => {
      for (const p of priority) {
        const r = roles.find((x) => x.key === p)
        if (r) return r
      }
      return roles[0]
    })()

    const jti = crypto.randomUUID()
    const payload: JwtPayload = {
      sub: user.id,
      emp: user.employee.id,
      empCode: user.employee.employeeCode,
      email: user.email,
      name: user.employee.fullName,
      inst: user.employee.institutionId,
      roles,
      act: preferred?.key ?? 'FACULTY',
      dep: preferred?.departmentId ?? null,
      desig: user.employee.designation?.title ?? null,
      dept: user.employee.departmentId,
      campus: user.employee.campusId,
      jti,
    }
    const token = this.jwt.sign(payload)
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000)
    await this.prisma.userSession.create({ data: { userId: user.id, jti, ip, deviceLabel, expiresAt } })
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), failedAttempts: 0 } })
    await this.audit.record({
      userId: user.id,
      actorEmail: user.email,
      action: 'LOGIN',
      module: 'auth',
      summary: `${user.employee.fullName} signed in`,
    })
    return { token, expiresAt, view: await this.sessionView(user.id, payload) }
  }

  async sessionView(userId: string, payload?: JwtPayload): Promise<SessionView> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: { include: { department: true, designation: true, institution: { include: { campuses: true } } } },
        userRoles: { include: { role: true, department: true } },
      },
    })
    if (!user || !user.employee) throw new UnauthorizedError('Session no longer valid')
    const activeRoleKey = payload?.act ?? (user.userRoles[0]?.role.key ?? 'FACULTY')
    const permissions = await this.registry.permissionsForRoles([activeRoleKey])
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.employee.fullName,
        employeeId: user.employee.id,
        employeeCode: user.employee.employeeCode,
        designationTitle: user.employee.designation?.title ?? null,
        departmentId: user.employee.departmentId,
        departmentName: user.employee.department?.name ?? null,
        campusId: user.employee.campusId,
        photoSeed: user.employee.photoSeed,
      },
      institution: {
        id: user.employee.institution.id,
        name: user.employee.institution.name,
        code: user.employee.institution.code,
        type: user.employee.institution.type,
      },
      campuses: user.employee.institution.campuses.map((c) => ({ id: c.id, name: c.name, code: c.code, isMain: c.isMain })),
      roles: user.userRoles.map((ur) => ({
        key: ur.role.key,
        name: ur.role.name,
        departmentId: ur.departmentId,
        departmentName: ur.department?.name ?? null,
      })),
      activeRoleKey,
      permissions,
    }
  }

  async switchRole(userId: string, roleKey: string, currentTokenRaw?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { userRoles: { include: { role: true } } } })
    if (!user) throw new UnauthorizedError()
    const target = user.userRoles.find((ur) => ur.role.key === roleKey)
    if (!target) throw new BadRequestError(`You do not hold the role ${roleKey}`)
    const emp = await this.prisma.employee.findUnique({
      where: { id: user.employeeId },
      include: { designation: true },
    })
    if (!emp) throw new UnauthorizedError()
    let old: JwtPayload | null = null
    if (currentTokenRaw) {
      try { old = this.jwt.decode<JwtPayload>(currentTokenRaw) } catch { old = null }
    }
    const payload: JwtPayload = {
      sub: user.id,
      emp: emp.id,
      empCode: emp.employeeCode,
      email: user.email,
      name: emp.fullName,
      inst: emp.institutionId,
      roles: user.userRoles.map((ur) => ({ key: ur.role.key, departmentId: ur.departmentId })),
      act: roleKey,
      dep: target.departmentId,
      desig: emp.designation?.title ?? null,
      dept: emp.departmentId,
      campus: emp.campusId,
      jti: old?.jti ?? crypto.randomUUID(),
    }
    const token = this.jwt.sign(payload)
    return { token, view: await this.sessionView(user.id, payload) }
  }

  async logout(userId: string | null, jti?: string) {
    if (userId) {
      await this.audit.record({ userId, actorEmail: '', action: 'LOGOUT', module: 'auth', summary: 'Signed out' })
      if (jti) {
        await this.prisma.userSession.updateMany({ where: { jti }, data: { revokedAt: new Date() } })
      }
    }
    return { ok: true }
  }

  async demoAccounts() {
    const users = await this.prisma.user.findMany({
      where: { isDemo: true },
      include: { employee: { include: { designation: true, department: true } }, userRoles: { include: { role: true } } },
      orderBy: { email: 'asc' },
    })
    const priority = ['SUPER_ADMIN', 'PRINCIPAL', 'HR_ADMIN', 'HOD', 'ACCOUNTANT', 'FACULTY', 'NON_TEACHING_STAFF', 'TECHNICAL_STAFF']
    return users.map((u) => {
      const roles = [...u.userRoles].sort((a, b) => (priority.indexOf(a.role.key) + 99) - (priority.indexOf(b.role.key) + 99))
      const primary = roles[0]?.role ?? u.userRoles[0]?.role
      return {
        email: u.email,
        name: u.employee.fullName,
        roleKey: primary?.key ?? '',
        roleName: primary?.name ?? '',
        designation: u.employee.designation?.title ?? null,
        departmentName: u.employee.department?.name ?? null,
        photoSeed: u.employee.photoSeed,
      }
    })
  }

  async mySessions(userId: string) {
    const rows = await this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return rows.map((s) => ({
      id: s.id,
      deviceLabel: s.deviceLabel,
      ip: s.ip,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      revokedAt: s.revokedAt,
    }))
  }

  async revokeSession(userId: string, sessionId: string) {
    const row = await this.prisma.userSession.findUnique({ where: { id: sessionId } })
    if (!row || row.userId !== userId) throw new NotFoundError('Session not found')
    await this.prisma.userSession.update({ where: { id: sessionId }, data: { revokedAt: new Date() } })
    return { ok: true }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedError()
    const { compare, hash } = await import('bcryptjs')
    if (!(await compare(currentPassword, user.passwordHash))) {
      throw new BadRequestError('Current password is incorrect')
    }
    const passwordHash = await hash(newPassword, 10)
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    return { ok: true }
  }

  cookieOptions(maxAgeMs = 7 * 24 * 3600 * 1000) {
    return { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: maxAgeMs }
  }

  decode(token: string): JwtPayload | null {
    if (!token) return null
    try {
      return this.jwt.decode<JwtPayload>(token) ?? null
    } catch {
      return null
    }
  }
}
