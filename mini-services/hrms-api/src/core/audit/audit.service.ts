import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface AuditEntry {
  userId?: string | null
  actorEmail: string
  action: string // e.g. 'LEAVE_APPLIED', 'PAYROLL_RUN_COMPLETED'
  module: string
  entityType?: string
  entityId?: string
  summary: string
  detail?: unknown
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          actorEmail: entry.actorEmail,
          action: entry.action,
          module: entry.module,
          entityType: entry.entityType ?? null,
          entityId: entry.entityId ?? null,
          summary: entry.summary,
          detail: (entry.detail ?? undefined) as never,
        },
      })
    } catch {
      // audit failures must never break the request
    }
  }
}
