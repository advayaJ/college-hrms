import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { SessionUser } from '../../core/auth/auth.types'
import { NotFoundError } from '../../core/http/envelope'

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(user: SessionUser, limit = 30) {
    const [unread, rows] = await Promise.all([
      this.prisma.notification.count({ where: { userId: user.userId, isRead: false } }),
      this.prisma.notification.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ])
    return {
      unread,
      items: rows.map((n) => ({
        id: n.id, kind: n.kind, title: n.title, body: n.body,
        link: n.link, severity: n.severity, isRead: n.isRead, createdAt: n.createdAt,
      })),
    }
  }

  async markRead(id: string, user: SessionUser) {
    const n = await this.prisma.notification.findUnique({ where: { id } })
    if (!n || n.userId !== user.userId) throw new NotFoundError('Notification not found')
    await this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } })
    return { ok: true }
  }

  async markAllRead(user: SessionUser) {
    await this.prisma.notification.updateMany({
      where: { userId: user.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    return { ok: true }
  }

  /** Activity feed for dashboards — recent audit entries visible to this user. */
  async activity(user: SessionUser, limit = 12) {
    const canAudit = user.permissions.includes('settings:audit_read')
    const rows = await this.prisma.auditLog.findMany({
      where: canAudit ? {} : { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { employee: { select: { photoSeed: true } } } } },
    })
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      module: r.module,
      summary: r.summary,
      actorEmail: r.actorEmail === 'system' ? 'System' : r.actorEmail,
      createdAt: r.createdAt,
      photoSeed: r.user?.employee?.photoSeed ?? 0,
    }))
  }
}
