import { Injectable } from '@nestjs/common'
import { AttendanceStatus, AttendanceSource, PunchRecord, Prisma } from '@prisma/client'
import { IsDateString, IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../../core/audit/audit.service'
import { ApprovalEngine } from '../../core/approvals/approval-engine.service'
import { SessionUser } from '../../core/auth/auth.types'
import { deptIdsOf, scopeFor } from '../../core/scope'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../core/http/envelope'

export class ManualEntryDto {
  @IsOptional() @IsString() employeeCode?: string
  @IsDateString() date!: string // YYYY-MM-DD
  @IsEnum(AttendanceStatus) status!: AttendanceStatus
  @IsOptional() @IsString() inTime?: string // HH:mm
  @IsOptional() @IsString() outTime?: string
  @IsOptional() @IsString() remarks?: string
}

export class CorrectionDto {
  @IsDateString() date!: string
  @IsOptional() @IsString() requestedIn?: string
  @IsOptional() @IsString() requestedOut?: string
  @IsString() @MinLength(8) @MaxLength(300) reason!: string
}

const dayStart = (d: string) => new Date(`${d}T00:00:00Z`)
const dayEnd = (d: string) => new Date(new Date(`${d}T00:00:00Z`).getTime() + 24 * 3600 * 1000)
const combine = (d: string, hm?: string) => (hm ? new Date(`${d}T${hm.length === 5 ? hm : hm + ':00'}Z`) : null)

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService, private audit: AuditService, private engine: ApprovalEngine) {}

  private async scopedEmployeeWhere(user: SessionUser): Promise<Prisma.EmployeeWhereInput> {
    const scope = scopeFor(user, 'attendance:read_all', 'attendance:read_dept', 'attendance:read_self')
    if (scope.kind === 'ALL') return {}
    if (scope.kind === 'DEPT') return { departmentId: { in: scope.departmentIds } }
    return { id: user.employeeId }
  }

  async dayView(date: string, departmentId: string | undefined, campusId: string | undefined, user: SessionUser) {
    const employeeWhere = await this.scopedEmployeeWhere(user)
    const emp = await this.prisma.employee.findMany({
      where: { ...employeeWhere, ...(departmentId ? { departmentId } : {}), ...(campusId ? { campusId } : {}) },
      select: { id: true, employeeCode: true, fullName: true, departmentId: true, department: { select: { name: true } }, campusId: true },
    })
    const empIds = emp.map((e) => e.id)
    const records = await this.prisma.attendanceRecord.findMany({
      where: { employeeId: { in: empIds }, date: dayStart(date) },
    })
    const byEmp = new Map(records.map((r) => [r.employeeId, r]))
    const punches = await this.prisma.punchRecord.findMany({
      where: { employeeId: { in: empIds }, timestamp: { gte: dayStart(date), lt: dayEnd(date) } },
      orderBy: { timestamp: 'asc' },
    })
    const punchesByEmp = new Map<string, PunchRecord[]>()
    for (const p of punches) {
      const list = punchesByEmp.get(p.employeeId) ?? []
      list.push(p)
      punchesByEmp.set(p.employeeId, list)
    }

    const rows = emp.map((e) => {
      const r = byEmp.get(e.id)
      return {
        employeeCode: e.employeeCode,
        name: e.fullName,
        department: e.department?.name ?? null,
        status: r?.status ?? 'NO_RECORD',
        inTime: r?.inTime ?? null,
        outTime: r?.outTime ?? null,
        workedHours: r?.workedHours ?? null,
        isManual: r?.isManual ?? false,
        source: r?.source ?? null,
        punchCount: (punchesByEmp.get(e.id) ?? []).length,
      }
    })

    const anomalies: { type: string; employeeCode: string; name: string; detail: string }[] = []
    for (const e of emp) {
      const r = byEmp.get(e.id)
      const p = punchesByEmp.get(e.id) ?? []
      if (!r && p.length > 0) {
        anomalies.push({ type: 'PUNCH_NO_RECORD', employeeCode: e.employeeCode, name: e.fullName, detail: `${p.length} punch(es) with no attendance record` })
      }
      if (r && (r.status === 'PRESENT' || r.status === 'HALF_DAY')) {
        if (!r.inTime && p.length === 0) anomalies.push({ type: 'MISSING_IN', employeeCode: e.employeeCode, name: e.fullName, detail: 'No in-time or punches for a present day' })
        if (!r.outTime && p.length <= 1) anomalies.push({ type: 'MISSING_OUT', employeeCode: e.employeeCode, name: e.fullName, detail: 'No out-time recorded' })
      }
    }

    const counts: Record<string, number> = {}
    for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1
    return { date, rows, counts, anomalies, total: rows.length }
  }

  async overview(user: SessionUser) {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const employeeWhere = await this.scopedEmployeeWhere(user)
    const [statusCounts, deptAgg] = await Promise.all([
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { date: dayStart(todayStr), employee: employeeWhere },
        _count: { _all: true },
      }),
      this.prisma.attendanceRecord.groupBy({
        by: ['status', 'campusId'],
        where: { date: dayStart(todayStr), employee: employeeWhere },
        _count: { _all: true },
      }),
    ])
    const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]))

    // 14-day trend
    const since = dayStart(new Date(Date.now() - 13 * 24 * 3600 * 1000).toISOString().slice(0, 10))
    const trendRows = await this.prisma.attendanceRecord.findMany({
      where: { date: { gte: since }, employee: employeeWhere },
      select: { date: true, status: true },
    })
    const trend: Record<string, { present: number; absent: number; onLeave: number; off: number }> = {}
    for (const r of trendRows) {
      const key = r.date.toISOString().slice(0, 10)
      const t = (trend[key] ??= { present: 0, absent: 0, onLeave: 0, off: 0 })
      if (r.status === 'PRESENT' || r.status === 'HALF_DAY' || r.status === 'WFH' || r.status === 'OFFICIAL_DUTY') t.present++
      else if (r.status === 'ABSENT') t.absent++
      else if (r.status === 'ON_LEAVE') t.onLeave++
      else t.off++
    }
    const series = Object.entries(trend)
      .map(([date, t]) => ({ date, ...t }))
      .sort((a, b) => a.date.localeCompare(b.date))
    return { date: todayStr, counts, series }
  }

  async monthly(month: number, year: number, user: SessionUser, departmentId?: string) {
    const from = new Date(Date.UTC(year, month - 1, 1))
    const to = new Date(Date.UTC(year, month, 1))
    const employeeWhere = await this.scopedEmployeeWhere(user)
    const employees = await this.prisma.employee.findMany({
      where: { ...employeeWhere, ...(departmentId ? { departmentId } : {}) },
      select: { id: true, employeeCode: true, fullName: true, departmentId: true, department: { select: { name: true } } },
      orderBy: { fullName: 'asc' },
    })
    const empIds = employees.map((e) => e.id)
    const records = await this.prisma.attendanceRecord.findMany({
      where: { employeeId: { in: empIds }, date: { gte: from, lt: to } },
      select: { employeeId: true, date: true, status: true, inTime: true },
    })

    const perDay: Record<string, Record<string, number>> = {}
    const perEmp = new Map<string, Record<string, number>>()
    for (const e of employees) perEmp.set(e.id, { present: 0, halfDay: 0, absent: 0, onLeave: 0, offDuty: 0, off: 0, late: 0 })
    for (const r of records) {
      const dayKey = r.date.toISOString().slice(0, 10)
      const day = (perDay[dayKey] ??= { present: 0, absent: 0, onLeave: 0, off: 0, total: 0 })
      day.total++
      const emp = perEmp.get(r.employeeId)!
      if (r.status === 'PRESENT') { day.present++; emp.present++ }
      else if (r.status === 'HALF_DAY') { day.present++; emp.halfDay++ }
      else if (r.status === 'WFH' || r.status === 'OFFICIAL_DUTY') { day.present++; emp.offDuty++ }
      else if (r.status === 'ABSENT') { day.absent++; emp.absent++ }
      else if (r.status === 'ON_LEAVE') { day.onLeave++; emp.onLeave++ }
      else { day.off++; emp.off++ }
      if (r.inTime && r.inTime.getUTCHours() >= 10 && (r.status === 'PRESENT' || r.status === 'HALF_DAY')) emp.late++
    }
    const days = Object.entries(perDay).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date))

    const byDepartment = new Map<string, { department: string; present: number; absent: number; onLeave: number; total: number }>()
    for (const e of employees) {
      const emp = perEmp.get(e.id)!
      const deptName = e.department?.name ?? '—'
      const agg = byDepartment.get(e.departmentId ?? 'none') ?? { department: deptName, present: 0, absent: 0, onLeave: 0, total: 0 }
      agg.present += emp.present + emp.halfDay + emp.offDuty
      agg.absent += emp.absent
      agg.onLeave += emp.onLeave
      agg.total += emp.present + emp.halfDay + emp.absent + emp.onLeave + emp.offDuty
      byDepartment.set(e.departmentId ?? 'none', agg)
    }

    const rows: {
      employeeCode: string; name: string; department: string | null
      present: number; halfDay: number; absent: number; onLeave: number; offDuty: number; off: number; late: number
      rate: number
    }[] = employees.map((e) => {
      const emp = perEmp.get(e.id)!
      const working = emp.present + emp.halfDay + emp.absent + emp.onLeave + emp.offDuty
      const attended = emp.present + emp.halfDay + emp.offDuty
      return {
        employeeCode: e.employeeCode,
        name: e.fullName,
        department: e.department?.name ?? null,
        present: emp.present, halfDay: emp.halfDay, absent: emp.absent, onLeave: emp.onLeave,
        offDuty: emp.offDuty, off: emp.off, late: emp.late,
        rate: working ? Math.round((attended / working) * 100) : 100,
      }
    })
    const rates = rows.filter((r) => r.present + r.halfDay + r.absent + r.onLeave > 0).map((r) => r.rate)
    return {
      month, year,
      days,
      byDepartment: [...byDepartment.values()].filter((d) => d.total > 0),
      employees: rows.sort((a, b) => a.rate - b.rate).slice(0, 60),
      averageRate: rates.length ? Math.round(rates.reduce((s, r) => s + r, 0) / rates.length) : 100,
      lowAttendance: rows.filter((r) => r.rate < 80).slice(0, 15),
    }
  }

  async self(from: string, to: string, user: SessionUser) {
    const records = await this.prisma.attendanceRecord.findMany({
      where: { employeeId: user.employeeId, date: { gte: dayStart(from), lte: dayStart(to) } },
      orderBy: { date: 'desc' },
    })
    const punches = await this.prisma.punchRecord.findMany({
      where: { employeeId: user.employeeId, timestamp: { gte: new Date(Date.now() - 3 * 24 * 3600 * 1000) } },
      orderBy: { timestamp: 'desc' },
      take: 40,
    })
    const corrections = await this.prisma.attendanceCorrection.findMany({
      where: { employeeId: user.employeeId },
      orderBy: { appliedAt: 'desc' },
      take: 20,
    })
    const month = new Date().toISOString().slice(0, 7)
    const monthRecords = records.filter((r) => r.date.toISOString().slice(0, 7) === month)
    const presentish = monthRecords.filter((r) => ['PRESENT', 'HALF_DAY', 'WFH', 'OFFICIAL_DUTY'].includes(r.status)).length
    return {
      records: records.map((r) => ({ date: r.date, status: r.status, inTime: r.inTime, outTime: r.outTime, workedHours: r.workedHours, isManual: r.isManual, source: r.source })),
      punches: punches.map((p) => ({ timestamp: p.timestamp, direction: p.direction, source: p.source })),
      corrections: corrections.map((c) => ({ referenceNo: c.referenceNo, date: c.date, status: c.status, reason: c.reason, requestedIn: c.requestedIn, requestedOut: c.requestedOut, appliedAt: c.appliedAt })),
      monthStats: { month, presentDays: presentish, recordedDays: monthRecords.length },
    }
  }

  async manualEntry(dto: ManualEntryDto, user: SessionUser) {
    let employeeId = user.employeeId
    let employeeName: string | null = null
    if (dto.employeeCode && dto.employeeCode !== user.employeeCode) {
      const target = await this.prisma.employee.findUnique({ where: { employeeCode: dto.employeeCode } })
      if (!target) throw new NotFoundError(`Employee ${dto.employeeCode} not found`)
      const scope = scopeFor(user, 'attendance:read_all', 'attendance:read_dept', 'attendance:read_self')
      if (scope.kind === 'DEPT' && (!target.departmentId || !scope.departmentIds.includes(target.departmentId))) {
        throw new ForbiddenError('You can only mark attendance for your department')
      }
      employeeId = target.id
      employeeName = target.fullName
    }
    const inT = combine(dto.date, dto.inTime ?? undefined)
    const outT = combine(dto.date, dto.outTime ?? undefined)
    const workedHours = inT && outT ? Math.max(0, (outT.getTime() - inT.getTime()) / 3600000) : null
    await this.prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date: dayStart(dto.date) } },
      create: {
        employeeId, campusId: (await this.prisma.employee.findUnique({ where: { id: employeeId }, select: { campusId: true } }))!.campusId,
        date: dayStart(dto.date), status: dto.status, inTime: inT, outTime: outT, workedHours,
        isManual: true, source: 'MANUAL', remarks: dto.remarks ?? null,
      },
      update: { status: dto.status, inTime: inT, outTime: outT, workedHours, isManual: true, source: 'MANUAL', remarks: dto.remarks ?? null },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'ATTENDANCE_MANUAL_ENTRY', module: 'attendance',
      entityType: 'AttendanceRecord', entityId: `${employeeId}:${dto.date}`,
      summary: `Manual entry for ${employeeName ?? user.name} on ${dto.date} (${dto.status})`,
    })
    return { ok: true }
  }

  async requestCorrection(dto: CorrectionDto, user: SessionUser) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: user.employeeId, date: dayStart(dto.date) } },
    })
    if (!record && dto.requestedIn == null && dto.requestedOut == null) {
      throw new BadRequestError('Provide requested in/out times — no attendance exists for this date')
    }
    if (record && (!dto.requestedIn && !dto.requestedOut)) {
      throw new BadRequestError('Provide the corrected in-time or out-time')
    }
    const dup = await this.prisma.attendanceCorrection.findFirst({
      where: { employeeId: user.employeeId, date: dayStart(dto.date), status: 'PENDING' },
    })
    if (dup) throw new BadRequestError(`Correction ${dup.referenceNo} is already pending for this date`)
    const employee = (await this.prisma.employee.findUnique({ where: { id: user.employeeId }, include: { department: true } }))!
    const correction = await this.prisma.attendanceCorrection.create({
      data: {
        referenceNo: `COR-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        employeeId: user.employeeId,
        date: dayStart(dto.date),
        requestedIn: combine(dto.date, dto.requestedIn ?? undefined),
        requestedOut: combine(dto.date, dto.requestedOut ?? undefined),
        reason: dto.reason,
        status: 'PENDING',
      },
    })
    const request = await this.engine.submit({
      docType: 'ATTENDANCE_CORRECTION',
      docId: correction.id,
      title: `Correction for ${dto.date}`,
      institutionId: user.institutionId,
      initiatedByUserId: user.userId,
      initiatorName: employee.fullName,
      contextDepartmentId: employee.departmentId,
    })
    await this.prisma.attendanceCorrection.update({ where: { id: correction.id }, data: { approvalRequestId: request.id } })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'ATTENDANCE_CORRECTION_REQUESTED', module: 'attendance',
      entityType: 'AttendanceCorrection', entityId: correction.id,
      summary: `Correction requested for ${dto.date}: ${dto.reason.slice(0, 80)}`,
    })
    return { referenceNo: correction.referenceNo, approvalRef: request.referenceNo }
  }

  async corrections(user: SessionUser, status?: string) {
    const scope = scopeFor(user, 'attendance:read_all', 'attendance:read_dept', 'attendance:read_self')
    const where: Prisma.AttendanceCorrectionWhereInput = {}
    if (status) where.status = status as never
    if (scope.kind === 'SELF') where.employeeId = user.employeeId
    else if (scope.kind === 'DEPT') where.employee = { departmentId: { in: scope.departmentIds } }
    const rows = await this.prisma.attendanceCorrection.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      take: 100,
      include: { employee: { include: { department: true } } },
    })
    return rows.map((c) => ({
      id: c.id,
      referenceNo: c.referenceNo,
      employee: { code: c.employee.employeeCode, name: c.employee.fullName, department: c.employee.department?.name ?? null },
      date: c.date,
      requestedIn: c.requestedIn,
      requestedOut: c.requestedOut,
      reason: c.reason,
      status: c.status,
      appliedAt: c.appliedAt,
      decidedAt: c.decidedAt,
      decisionNote: c.decisionNote,
      approvalRequestId: c.approvalRequestId,
    }))
  }

  /** Called by ApprovalsService when a correction request reaches an outcome. */
  async applyCorrectionOutcome(correctionId: string, outcome: 'APPROVED' | 'REJECTED' | 'RETURNED', note: string | null) {
    const c = await this.prisma.attendanceCorrection.findUnique({ where: { id: correctionId } })
    if (!c) return
    await this.prisma.attendanceCorrection.update({
      where: { id: correctionId },
      data: { status: outcome, decidedAt: new Date(), decisionNote: note },
    })
    if (outcome === 'APPROVED') {
      const dateKey = c.date.toISOString().slice(0, 10)
      const inT = c.requestedIn
      const outT = c.requestedOut
      const worked = inT && outT ? Math.max(0, (outT.getTime() - inT.getTime()) / 3600000) : null
      const existing = await this.prisma.attendanceRecord.findUnique({
        where: { employeeId_date: { employeeId: c.employeeId, date: c.date } },
      })
      if (existing) {
        await this.prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: {
            inTime: inT ?? existing.inTime,
            outTime: outT ?? existing.outTime,
            workedHours: worked ?? existing.workedHours,
            isManual: true,
            source: 'MANUAL' as AttendanceSource,
            remarks: `Corrected per ${c.referenceNo}`,
          },
        })
      } else {
        await this.prisma.attendanceRecord.create({
          data: {
            employeeId: c.employeeId,
            campusId: (await this.prisma.employee.findUnique({ where: { id: c.employeeId }, select: { campusId: true } }))!.campusId,
            date: c.date,
            status: 'PRESENT',
            inTime: inT,
            outTime: outT,
            workedHours: worked,
            isManual: true,
            source: 'MANUAL',
            remarks: `Created per approved correction ${c.referenceNo}`,
          },
        })
      }
    }
  }

  /** Marks ON_LEAVE attendance rows for a date range (called on leave approval). */
  async markLeaveAttendance(employeeId: string, fromISO: string, toISO: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId }, select: { campusId: true } })
    if (!employee) return
    const from = new Date(fromISO)
    const to = new Date(toISO)
    for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 24 * 3600 * 1000)) {
      const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      // never overwrite HOLIDAY / WEEKLY_OFF with leave
      const existing = await this.prisma.attendanceRecord.findUnique({ where: { employeeId_date: { employeeId, date: day } } })
      if (existing && (existing.status === 'HOLIDAY' || existing.status === 'WEEKLY_OFF')) continue
      if (existing) {
        await this.prisma.attendanceRecord.update({ where: { id: existing.id }, data: { status: 'ON_LEAVE' } })
      } else {
        await this.prisma.attendanceRecord.create({
          data: { employeeId, campusId: employee.campusId, date: day, status: 'ON_LEAVE', source: 'SYSTEM' },
        })
      }
    }
  }
}
