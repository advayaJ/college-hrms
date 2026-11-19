import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { IsArray, IsBoolean, IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../../core/audit/audit.service'
import { ApprovalEngine } from '../../core/approvals/approval-engine.service'
import { SessionUser } from '../../core/auth/auth.types'
import { scopeFor } from '../../core/scope'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../core/http/envelope'

export class ApplyLeaveDto {
  @IsString() leaveTypeId!: string
  @IsDateString() fromDate!: string
  @IsDateString() toDate!: string
  @IsOptional() @IsBoolean() isHalfDayStart?: boolean
  @IsOptional() @IsBoolean() isHalfDayEnd?: boolean
  @IsString() @MinLength(10) @MaxLength(400) reason!: string
  @IsOptional() @IsString() contactDuringLeave?: string
}

export class UpdateLeaveApplicationDto {
  @IsDateString() fromDate!: string
  @IsDateString() toDate!: string
  @IsString() @MinLength(10) @MaxLength(400) reason!: string
  @IsOptional() @IsString() contactDuringLeave?: string
}

const dayStart = (d: string) => new Date(`${d}T00:00:00Z`)
const daysBetween = (from: string, to: string, halfStart = false, halfEnd = false) => {
  const ms = dayStart(to).getTime() - dayStart(from).getTime()
  if (ms < 0) return -1
  let days = ms / (24 * 3600 * 1000) + 1
  if (days === 1) {
    if (halfStart || halfEnd) days = 0.5
  } else {
    if (halfStart) days -= 0.5
    if (halfEnd) days -= 0.5
  }
  return days
}

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService, private audit: AuditService, private engine: ApprovalEngine) {}

  async types(user: SessionUser) {
    const rows = await this.prisma.leaveType.findMany({
      where: { institutionId: user.institutionId, isActive: true },
      orderBy: { name: 'asc' },
    })
    return rows
  }

  async balances(user: SessionUser, employeeCode?: string) {
    let employeeId = user.employeeId
    if (employeeCode && employeeCode !== user.employeeCode) {
      const scope = scopeFor(user, 'leave:read_all', 'leave:read_dept', 'leave:read_self')
      const target = await this.prisma.employee.findUnique({
        where: { employeeCode },
        include: { department: true },
      })
      if (!target) throw new NotFoundError('Employee not found')
      if (scope.kind === 'SELF' && target.id !== user.employeeId) throw new ForbiddenError()
      if (scope.kind === 'DEPT' && (!target.departmentId || !scope.departmentIds.includes(target.departmentId))) {
        throw new ForbiddenError('Outside your department scope')
      }
      employeeId = target.id
    }
    const year = new Date().getFullYear()
    const rows = await this.prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
      orderBy: { leaveType: { name: 'asc' } },
    })
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId }, select: { staffType: true } })
    const types = await this.prisma.leaveType.findMany({ where: { institutionId: user.institutionId, isActive: true } })
    // fill zero-balance types for display
    const present = new Set(rows.map((r) => r.leaveTypeId))
    const missing = types.filter((t) => !present.has(t.id) && (
      (t.applicableTo === 'ALL') ||
      (employee?.staffType === 'TEACHING' && t.applicableTo === 'TEACHING_ONLY') ||
      (employee?.staffType !== 'TEACHING' && t.applicableTo === 'NON_TEACHING_ONLY')
    ))
    return {
      year,
      balances: [
        ...rows.map((b) => ({
          leaveTypeId: b.leaveTypeId,
          code: b.leaveType.code,
          name: b.leaveType.name,
          paid: b.leaveType.paid,
          entitled: b.entitled + b.carriedForward,
          carriedForward: b.carriedForward,
          used: b.usedDays,
          pending: b.pendingDays,
          available: Math.round((b.entitled + b.carriedForward - b.usedDays - b.pendingDays) * 10) / 10,
        })),
        ...missing.map((t) => ({
          leaveTypeId: t.id, code: t.code, name: t.name, paid: t.paid,
          entitled: t.annualQuota, carriedForward: 0, used: 0, pending: 0, available: t.annualQuota,
        })),
      ],
    }
  }

  async apply(dto: ApplyLeaveDto, user: SessionUser) {
    const type = await this.prisma.leaveType.findUnique({ where: { id: dto.leaveTypeId } })
    if (!type || !type.isActive) throw new BadRequestError('Unknown leave type')
    const employee = await this.prisma.employee.findUnique({
      where: { id: user.employeeId },
      include: { department: true },
    })
    if (!employee) throw new NotFoundError()
    if (type.applicableTo === 'TEACHING_ONLY' && employee.staffType !== 'TEACHING') {
      throw new BadRequestError(`${type.name} applies to teaching staff only`)
    }
    if (type.applicableTo === 'NON_TEACHING_ONLY' && employee.staffType === 'TEACHING') {
      throw new BadRequestError(`${type.name} applies to non-teaching staff only`)
    }
    const days = daysBetween(dto.fromDate, dto.toDate, dto.isHalfDayStart, dto.isHalfDayEnd)
    if (days <= 0) throw new BadRequestError('Leave duration must be at least half a day')
    if (type.maxConsecutiveDays && days > type.maxConsecutiveDays) {
      throw new BadRequestError(`${type.name} allows at most ${type.maxConsecutiveDays} consecutive days`)
    }
    // overlap check
    const overlapping = await this.prisma.leaveApplication.findFirst({
      where: {
        employeeId: employee.id,
        status: { in: ['PENDING', 'APPROVED'] },
        AND: [
          { fromDate: { lte: dayStart(dto.toDate) } },
          { toDate: { gte: dayStart(dto.fromDate) } },
        ],
      },
    })
    if (overlapping) throw new BadRequestError(`Overlaps with ${overlapping.referenceNo} (${overlapping.status})`)

    const balanceYear = new Date().getFullYear()
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_leaveTypeId_year: { employeeId: employee.id, leaveTypeId: type.id, year: balanceYear } },
    })
    const available = balance ? balance.entitled + balance.carriedForward - balance.usedDays - balance.pendingDays : type.annualQuota
    if (days > available) {
      throw new BadRequestError(`Insufficient balance: ${available} day(s) available for ${type.name}`)
    }

    const referenceNo = `LVN-${balanceYear}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
    const app = await this.prisma.leaveApplication.create({
      data: {
        referenceNo,
        employeeId: employee.id,
        leaveTypeId: type.id,
        fromDate: dayStart(dto.fromDate),
        toDate: dayStart(dto.toDate),
        days,
        isHalfDayStart: dto.isHalfDayStart ?? false,
        isHalfDayEnd: dto.isHalfDayEnd ?? false,
        reason: dto.reason,
        contactDuringLeave: dto.contactDuringLeave ?? null,
        status: 'PENDING',
        balanceYear,
      },
    })
    if (balance) {
      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: { increment: days } },
      })
    } else {
      await this.prisma.leaveBalance.create({
        data: { employeeId: employee.id, leaveTypeId: type.id, year: balanceYear, entitled: type.annualQuota, pendingDays: days },
      })
    }
    const request = await this.engine.submit({
      docType: 'LEAVE_APPLICATION',
      docId: app.id,
      title: `${type.name} — ${days} day(s) from ${dto.fromDate}`,
      institutionId: user.institutionId,
      initiatedByUserId: user.userId,
      initiatorName: employee.fullName,
      contextDepartmentId: employee.departmentId,
    })
    await this.prisma.leaveApplication.update({ where: { id: app.id }, data: { approvalRequestId: request.id } })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'LEAVE_APPLIED', module: 'leave',
      entityType: 'LeaveApplication', entityId: app.id,
      summary: `${employee.fullName} applied for ${days} day(s) of ${type.name} (${referenceNo})`,
    })
    return { referenceNo, approvalRef: request.referenceNo, days, workflow: request.workflow.name }
  }

  async applications(user: SessionUser, filters: { status?: string; employeeCode?: string; mine?: boolean; departmentId?: string }, page = 1, pageSize = 25) {
    const scope = scopeFor(user, 'leave:read_all', 'leave:read_dept', 'leave:read_self')
    const where: Prisma.LeaveApplicationWhereInput = {}
    if (scope.kind === 'SELF' || filters.mine) where.employeeId = user.employeeId
    else if (scope.kind === 'DEPT') where.employee = { departmentId: { in: scope.departmentIds } }
    if (filters.status) where.status = filters.status as never
    if (filters.departmentId) where.employee = { ...(where.employee as object), departmentId: filters.departmentId }
    if (filters.employeeCode) where.employee = { ...(where.employee as object), employeeCode: filters.employeeCode }
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.leaveApplication.count({ where }),
      this.prisma.leaveApplication.findMany({
        where,
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          employee: { select: { employeeCode: true, fullName: true, department: { select: { name: true } } } },
          leaveType: { select: { name: true, code: true, paid: true } },
        },
      }),
    ])
    return {
      total, page, pageSize,
      items: rows.map((a) => ({
        id: a.id,
        referenceNo: a.referenceNo,
        employee: a.employee,
        leaveType: a.leaveType,
        fromDate: a.fromDate,
        toDate: a.toDate,
        days: a.days,
        isHalfDayStart: a.isHalfDayStart,
        isHalfDayEnd: a.isHalfDayEnd,
        reason: a.reason,
        status: a.status,
        appliedAt: a.appliedAt,
        decidedAt: a.decidedAt,
        decisionNote: a.decisionNote,
        approvalRequestId: a.approvalRequestId,
      })),
    }
  }

  async myApplication(refNo: string, user: SessionUser) {
    const app = await this.prisma.leaveApplication.findUnique({
      where: { referenceNo: refNo },
      include: {
        employee: { select: { id: true, employeeCode: true, fullName: true } },
        leaveType: true,
      },
    })
    if (!app) throw new NotFoundError('Application not found')
    const scope = scopeFor(user, 'leave:read_all', 'leave:read_dept', 'leave:read_self')
    const employeeDept = await this.prisma.employee.findUnique({ where: { id: app.employeeId }, select: { departmentId: true } })
    if (app.employee.id !== user.employeeId && scope.kind === 'SELF') throw new ForbiddenError()
    if (scope.kind === 'DEPT' && employeeDept?.departmentId && !scope.departmentIds.includes(employeeDept.departmentId)) {
      throw new ForbiddenError('Outside your department scope')
    }
    return app
  }

  async cancel(refNo: string, user: SessionUser) {
    const app = await this.prisma.leaveApplication.findUnique({ where: { referenceNo: refNo } })
    if (!app) throw new NotFoundError('Application not found')
    if (app.employeeId !== user.employeeId) throw new ForbiddenError('You can only cancel your own applications')
    if (app.status !== 'PENDING' && app.status !== 'APPROVED') {
      throw new BadRequestError(`Cannot cancel a ${app.status} application`)
    }
    if (app.status === 'APPROVED' && app.fromDate.getTime() < Date.now() - 24 * 3600 * 1000) {
      throw new BadRequestError('Approved leave already in effect — contact HR')
    }
    await this.prisma.leaveApplication.update({
      where: { id: app.id },
      data: { status: 'CANCELLED', decidedAt: new Date(), decisionNote: 'Cancelled by applicant' },
    })
    if (app.status === 'PENDING') {
      await this.prisma.leaveBalance.updateMany({
        where: { employeeId: app.employeeId, leaveTypeId: app.leaveTypeId, year: app.balanceYear },
        data: { pendingDays: { decrement: app.days } },
      })
    } else {
      await this.prisma.leaveBalance.updateMany({
        where: { employeeId: app.employeeId, leaveTypeId: app.leaveTypeId, year: app.balanceYear },
        data: { usedDays: { decrement: app.days } },
      })
    }
    if (app.approvalRequestId) await this.engine.cancel(app.approvalRequestId, user.name)
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'LEAVE_CANCELLED', module: 'leave',
      entityType: 'LeaveApplication', entityId: app.id, summary: `${refNo} cancelled by applicant`,
    })
    return { ok: true }
  }

  async updateReturned(refNo: string, dto: UpdateLeaveApplicationDto, user: SessionUser) {
    const app = await this.prisma.leaveApplication.findUnique({ where: { referenceNo: refNo } })
    if (!app) throw new NotFoundError('Application not found')
    if (app.employeeId !== user.employeeId) throw new ForbiddenError('You can only edit your own applications')
    if (app.status !== 'RETURNED') throw new BadRequestError('Only returned applications can be edited')
    const days = daysBetween(dto.fromDate, dto.toDate, app.isHalfDayStart, app.isHalfDayEnd)
    if (days <= 0) throw new BadRequestError('Leave duration must be at least half a day')
    await this.prisma.leaveApplication.update({
      where: { id: app.id },
      data: {
        fromDate: dayStart(dto.fromDate),
        toDate: dayStart(dto.toDate),
        days,
        reason: dto.reason,
        contactDuringLeave: dto.contactDuringLeave ?? null,
      },
    })
    return { ok: true, days }
  }

  async calendar(user: SessionUser, month: number, year: number) {
    const scope = scopeFor(user, 'leave:read_all', 'leave:read_dept', 'leave:read_self')
    const from = new Date(Date.UTC(year, month - 1, 1))
    const to = new Date(Date.UTC(year, month, 1))
    const where: Prisma.LeaveApplicationWhereInput = {
      status: 'APPROVED',
      AND: [{ fromDate: { lt: to } }, { toDate: { gte: from } }],
    }
    if (scope.kind === 'SELF') where.employeeId = user.employeeId
    else if (scope.kind === 'DEPT') where.employee = { departmentId: { in: scope.departmentIds } }
    const rows = await this.prisma.leaveApplication.findMany({
      where,
      include: { employee: { select: { employeeCode: true, fullName: true, department: { select: { name: true } } } }, leaveType: { select: { name: true, code: true } } },
    })
    const dayMap: Record<string, { code: string; name: string; type: string }[]> = {}
    for (const r of rows) {
      for (let d = new Date(r.fromDate); d <= r.toDate && d < to; d = new Date(d.getTime() + 24 * 3600 * 1000)) {
        const key = d.toISOString().slice(0, 10)
        ;(dayMap[key] ??= []).push({ code: r.employee.employeeCode, name: r.employee.fullName, type: r.leaveType.code })
      }
    }
    return { month, year, employees: rows.length, dayMap }
  }

  /** Called by ApprovalsService on workflow outcomes. */
  async applyLeaveOutcome(applicationId: string, outcome: 'APPROVED' | 'REJECTED' | 'RETURNED', note: string | null, attendance: AttendanceApply) {
    const app = await this.prisma.leaveApplication.findUnique({ where: { id: applicationId } })
    if (!app) return
    await this.prisma.leaveApplication.update({
      where: { id: applicationId },
      data: { status: outcome, decidedAt: new Date(), decisionNote: note },
    })
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_leaveTypeId_year: { employeeId: app.employeeId, leaveTypeId: app.leaveTypeId, year: app.balanceYear } },
    })
    if (balance) {
      if (outcome === 'APPROVED') {
        await this.prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: { decrement: app.days }, usedDays: { increment: app.days } },
        })
        await attendance.markLeaveAttendance(app.employeeId, app.fromDate.toISOString(), app.toDate.toISOString())
      } else {
        await this.prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: { decrement: app.days } },
        })
      }
    }
  }
}

export interface AttendanceApply {
  markLeaveAttendance(employeeId: string, fromISO: string, toISO: string): Promise<void>
}
