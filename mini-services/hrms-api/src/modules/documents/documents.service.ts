import { Injectable } from '@nestjs/common'
import { Response } from 'express'
import { Prisma } from '@prisma/client'
import { IsDateString, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../../core/audit/audit.service'
import { SessionUser } from '../../core/auth/auth.types'
import { scopeFor } from '../../core/scope'
import { ForbiddenError, NotFoundError } from '../../core/http/envelope'

export class UploadDocumentDto {
  @IsString() categoryId!: string
  @IsString() @MinLength(4) title!: string
  @IsOptional() @IsString() employeeCode?: string
  @IsOptional() @IsString() issuedBy?: string
  @IsOptional() @IsDateString() issuedOn?: string
  @IsOptional() @IsDateString() expiresOn?: string
  @IsOptional() @IsIn(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL']) accessLevel?: string
  @IsOptional() @IsString() fileName?: string
}

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async list(user: SessionUser, filters: { q?: string; categoryId?: string; employeeCode?: string; expiringInDays?: number; page?: number }) {
    const scope = scopeFor(user, 'documents:read_all', 'documents:read_dept', 'documents:read_self')
    const where: Prisma.EmployeeDocumentWhereInput = {}
    if (scope.kind === 'SELF') where.employeeId = user.employeeId
    else if (scope.kind === 'DEPT') where.employee = { departmentId: { in: scope.departmentIds } }
    if (filters.q) where.title = { contains: filters.q, mode: 'insensitive' }
    if (filters.categoryId) where.categoryId = filters.categoryId
    if (filters.employeeCode) {
      if (scope.kind === 'SELF') {
        where.employeeId = user.employeeId
      } else {
        where.employee = { ...((where.employee as Prisma.EmployeeWhereInput) ?? {}), employeeCode: filters.employeeCode }
      }
    }
    if (filters.expiringInDays) {
      const until = new Date(Date.now() + filters.expiringInDays * 24 * 3600 * 1000)
      where.expiresOn = { gte: new Date(), lte: until }
    }
    // confidential documents require the dedicated permission
    if (!user.permissions.includes('documents:read_confidential')) {
      where.accessLevel = { in: ['PUBLIC', 'INTERNAL'] }
    }
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.employeeDocument.count({ where }),
      this.prisma.employeeDocument.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip: ((filters.page ?? 1) - 1) * 25,
        take: 25,
        include: {
          category: true,
          employee: { select: { employeeCode: true, fullName: true, department: { select: { name: true } } } },
        },
      }),
    ])
    return {
      total, page: filters.page ?? 1,
      items: rows.map((d) => ({
        id: d.id,
        title: d.title,
        fileName: d.fileName,
        sizeKb: d.sizeKb,
        category: d.category.name,
        employee: d.employee,
        accessLevel: d.accessLevel,
        issuedOn: d.issuedOn,
        expiresOn: d.expiresOn,
        isVerified: d.isVerified,
        uploadedAt: d.uploadedAt,
        version: d.version,
        expiringInDays: d.expiresOn ? Math.round((new Date(d.expiresOn).getTime() - Date.now()) / (24 * 3600 * 1000)) : null,
      })),
    }
  }

  async categories(user: SessionUser) {
    return this.prisma.documentCategory.findMany({
      where: { institutionId: user.institutionId },
      orderBy: { name: 'asc' },
    })
  }

  async upload(dto: UploadDocumentDto, user: SessionUser) {
    let employeeId = user.employeeId
    if (dto.employeeCode && dto.employeeCode !== user.employeeCode) {
      if (!user.permissions.includes('documents:read_all') && !user.permissions.includes('documents:read_dept')) {
        throw new ForbiddenError('You can only upload documents for yourself')
      }
      const emp = await this.prisma.employee.findUnique({ where: { employeeCode: dto.employeeCode } })
      if (!emp) throw new NotFoundError('Employee not found')
      employeeId = emp.id
    }
    const category = await this.prisma.documentCategory.findUnique({ where: { id: dto.categoryId } })
    if (!category) throw new NotFoundError('Category not found')
    const doc = await this.prisma.employeeDocument.create({
      data: {
        employeeId,
        categoryId: dto.categoryId,
        title: dto.title,
        fileName: dto.fileName ?? `${dto.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        fileExt: 'pdf',
        sizeKb: 60 + Math.floor(Math.random() * 900),
        version: 1,
        issuedBy: dto.issuedBy ?? null,
        issuedOn: dto.issuedOn ? new Date(dto.issuedOn) : null,
        expiresOn: dto.expiresOn ? new Date(dto.expiresOn) : null,
        accessLevel: (dto.accessLevel as never) ?? category.sensitivity,
        uploadedByUserId: user.userId,
        contentHash: Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
      },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'DOCUMENT_UPLOADED', module: 'documents',
      entityType: 'EmployeeDocument', entityId: doc.id,
      summary: `Document "${dto.title}" (${category.name}) uploaded`,
    })
    return { id: doc.id }
  }

  async verify(id: string, user: SessionUser) {
    const doc = await this.prisma.employeeDocument.findUnique({ where: { id } })
    if (!doc) throw new NotFoundError('Document not found')
    await this.prisma.employeeDocument.update({
      where: { id },
      data: { isVerified: true, verifiedByUserId: user.userId },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'DOCUMENT_VERIFIED', module: 'documents',
      entityType: 'EmployeeDocument', entityId: id, summary: `Document "${doc.title}" verified`,
    })
    return { ok: true }
  }

  /** Guarded simulated vault download — streams a generated attestation file. */
  async download(id: string, user: SessionUser, res: Response) {
    const doc = await this.prisma.employeeDocument.findUnique({
      where: { id },
      include: { employee: true, category: true },
    })
    if (!doc) throw new NotFoundError('Document not found')
    const scope = scopeFor(user, 'documents:read_all', 'documents:read_dept', 'documents:read_self')
    const isSelf = doc.employeeId === user.employeeId
    const inDept = scope.kind === 'DEPT' && doc.employee.departmentId && scope.departmentIds.includes(doc.employee.departmentId)
    if (!(scope.kind === 'ALL' || isSelf || inDept)) throw new ForbiddenError()
    if (doc.accessLevel === 'CONFIDENTIAL' && !user.permissions.includes('documents:read_confidential') && !isSelf) {
      throw new ForbiddenError('Confidential document — restricted access')
    }
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'DOCUMENT_DOWNLOADED', module: 'documents',
      entityType: 'EmployeeDocument', entityId: doc.id,
      summary: `Downloaded "${doc.title}" (${doc.employee.employeeCode})`,
    })
    const content = [
      'ARYAVRATT UNIVERSITY — DOCUMENT VAULT (SIMULATED)',
      '===============================================',
      `Document     : ${doc.title}`,
      `Category      : ${doc.category.name}`,
      `Employee      : ${doc.employee.fullName} (${doc.employee.employeeCode})`,
      `Access level  : ${doc.accessLevel}`,
      `Issued by     : ${doc.issuedBy ?? '—'}  on ${doc.issuedOn?.toISOString().slice(0, 10) ?? '—'}`,
      `Expires on    : ${doc.expiresOn?.toISOString().slice(0, 10) ?? '—'}`,
      `Version       : ${doc.version}`,
      `Content SHA1  : ${doc.contentHash}`,
      `Retrieved by  : ${user.name} (${user.email}) at ${new Date().toISOString()}`,
      '',
      'This sandbox keeps document metadata, not real files. In production this',
      'endpoint would stream the encrypted blob from object storage after the',
      'same permission checks, and write the retrieval to the audit log.',
    ].join('\n')
    const r = res
    r.setHeader('Content-Type', 'text/plain; charset=utf-8')
    r.setHeader('Content-Disposition', `attachment; filename="${doc.fileName.replace(/\.[^.]+$/, '')}-vault.txt"`)
    r.send(content)
    return r
  }

  async expiring(days: number, user: SessionUser) {
    const until = new Date(Date.now() + days * 24 * 3600 * 1000)
    const rows = await this.prisma.employeeDocument.findMany({
      where: { expiresOn: { gte: new Date(), lte: until }, employee: { status: { not: 'SEPARATED' } } },
      include: { employee: { select: { employeeCode: true, fullName: true } }, category: true },
      orderBy: { expiresOn: 'asc' },
      take: 60,
    })
    return rows.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category.name,
      employee: d.employee,
      expiresOn: d.expiresOn,
      daysLeft: Math.ceil((new Date(d.expiresOn).getTime() - Date.now()) / (24 * 3600 * 1000)),
    }))
  }

  async notifyExpiring(days: number, user: SessionUser) {
    const rows = await this.prisma.employeeDocument.findMany({
      where: { expiresOn: { gte: new Date(), lte: new Date(Date.now() + days * 24 * 3600 * 1000) } },
      include: { employee: { select: { id: true } } },
    })
    let sent = 0
    for (const d of rows) {
      const owner = await this.prisma.user.findUnique({ where: { employeeId: d.employeeId } })
      if (owner) {
        await this.prisma.notification.create({
          data: {
            userId: owner.id,
            kind: 'DOCUMENT_EXPIRY',
            title: `Document expiring soon: ${d.title}`,
            body: `Your "${d.title}" expires on ${d.expiresOn.toISOString().slice(0, 10)}. Please arrange renewal.`,
            link: '#/documents',
            severity: 'WARNING',
          },
        })
        sent++
      }
    }
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'DOCUMENT_EXPIRY_NOTIFIED', module: 'documents',
      summary: `Expiry notifications sent for ${sent} documents (≤${days} days)`,
    })
    return { sent }
  }
}
