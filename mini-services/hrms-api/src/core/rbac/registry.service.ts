import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

/**
 * Runtime permission registry with a small in-memory cache (role permissions
 * change rarely). Invalidated by the settings module when permissions are
 * edited.
 */
@Injectable()
export class PermissionRegistry {
  private cache = new Map<string, { perms: string[]; at: number }>()
  private ttl = 30_000

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async permissionsForRole(roleKey: string): Promise<string[]> {
    const hit = this.cache.get(roleKey)
    if (hit && Date.now() - hit.at < this.ttl) return hit.perms
    const role = await this.prisma.role.findUnique({
      where: { key: roleKey },
      include: { permissions: { include: { permission: true } } },
    })
    const perms = role ? role.permissions.map((rp) => rp.permission.key) : []
    this.cache.set(roleKey, { perms, at: Date.now() })
    return perms
  }

  async permissionsForRoles(roleKeys: string[]): Promise<string[]> {
    const lists = await Promise.all([...new Set(roleKeys)].map((k) => this.permissionsForRole(k)))
    return [...new Set(lists.flat())]
  }

  invalidate(roleKey?: string) {
    if (roleKey) this.cache.delete(roleKey)
    else this.cache.clear()
  }
}
