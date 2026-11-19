import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from './decorators'
import { AUTH_COOKIE, JwtPayload, SessionUser } from './auth.types'
import { PermissionRegistry } from '../rbac/registry.service'
import { ForbiddenError, UnauthorizedError } from '../http/envelope'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    private registry: PermissionRegistry
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    const req = context.switchToHttp().getRequest<Request & { user?: SessionUser }>()

    const payload = this.safeReadToken(req)

    if (isPublic) {
      if (payload) {
        try {
          req.user = await this.toSession(payload)
        } catch { /* optional auth */ }
      }
      return true
    }

    if (!payload) throw new UnauthorizedError('Sign in required')
    const session = await this.toSession(payload)
    req.user = session

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (required && required.length > 0) {
      const granted = session.permissions.some((p) => required.includes(p))
      if (!granted) {
        throw new ForbiddenError(
          `Your active role (${session.activeRoleKey}) does not permit this action`
        )
      }
    }
    return true
  }

  private safeReadToken(req: Request): JwtPayload | null {
    try {
      const header = req.headers['authorization']
      if (header && header.startsWith('Bearer ')) {
        return this.jwt.verify<JwtPayload>(header.slice(7))
      }
      const cookie = (req.cookies || {})[AUTH_COOKIE]
      if (cookie) return this.jwt.verify<JwtPayload>(cookie)
    } catch {
      return null
    }
    return null
  }

  private async toSession(p: JwtPayload): Promise<SessionUser> {
    const permissions = await this.registry.permissionsForRoles([p.act])
    const activeRole = p.roles.find((r) => r.key === p.act)
    return {
      userId: p.sub,
      email: p.email,
      employeeId: p.emp,
      employeeCode: p.empCode,
      institutionId: p.inst,
      name: p.name,
      roles: p.roles,
      activeRoleKey: p.act,
      activeDepartmentId: activeRole?.departmentId ?? p.dep ?? null,
      permissions,
      designationTitle: p.desig ?? null,
      departmentId: p.dept ?? null,
      campusId: p.campus ?? null,
    }
  }
}
