import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ApprovalEngine } from '../../core/approvals/approval-engine.service'
import { SessionUser } from '../../core/auth/auth.types'
import { deptIdsOf } from '../../core/scope'
import { ok } from '../../core/http/envelope'

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService, private engine: ApprovalEngine) {}

  async dashboard(user: SessionUser) {
    const base = {
      roleKey: user.activeRoleKey,
      unreadNotifications: await this.prisma.notification.count({ where: { userId: user.userId, isRead: false } }),
      pendingApprovals: await this.approvalQueue(user),
    }
    switch (user.activeRoleKey) {
      case 'SUPER_ADMIN': return { ...base, ...(await this.superAdmin(user)) }
      case 'PRINCIPAL': return { ...base, ...(await this.principal(user)) }
      case 'HR_ADMIN': return { ...base, ...(await this.hrAdmin(user)) }
      case 'HOD': return { ...base, ...(await this.hod(user)) }
      case 'ACCOUNTANT': return { ...base, ...(await this.accountant(user)) }
      default: return { ...base, ...(await this.selfService(user)) }
    }
  }

  private async approvalQueue(user: SessionUser) {
    const items = await this.engine.pendingFor(user)
    return {
      count: items.length,
      top: items.slice(0, 5).map((i) => ({
        id: i.request.id,
        referenceNo: i.request.referenceNo,
        docType: i.request.docType,
        title: i.request.title,
        initiatorName: i.request.initiatorName,
        stage: i.stage.name,
        submittedAt: i.request.submittedAt,
      })),
    }
  }

  // ── Super Admin ──────────────────────────────────────────────────────
  private async superAdmin(user: SessionUser) {
    const [employees, users, departments, campuses, roles, sessions] = await Promise.all([
      this.prisma.employee.count({ where: { institutionId: user.institutionId, status: { not: 'SEPARATED' } } }),
      this.prisma.user.count(),
      this.prisma.department.count({ where: { institutionId: user.institutionId } }),
      this.prisma.campus.count({ where: { institutionId: user.institutionId } }),
      this.prisma.role.count(),
      this.prisma.userSession.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
    ])
    const [byStaffType, audit, workflowLoad] = await Promise.all([
      this.prisma.employee.groupBy({ by: ['staffType'], where: { institutionId: user.institutionId, status: { not: 'SEPARATED' } }, _count: { _all: true } }),
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      this.prisma.approvalRequest.groupBy({ by: ['docType'], where: { status: 'PENDING' }, _count: { _all: true } }),
    ])
    const joinings = await this.prisma.employee.findMany({
      where: { institutionId: user.institutionId, joiningDate: { gte: new Date(Date.now() - 365 * 24 * 3600 * 1000) } },
      select: { joiningDate: true },
    })
    const monthMap: Record<string, number> = {}
    for (const j of joinings) {
      const k = j.joiningDate.toISOString().slice(0, 7)
      monthMap[k] = (monthMap[k] ?? 0) + 1
    }
    return {
      kpis: [
        { key: 'employees', label: 'Employees on roll', value: employees, hint: 'active workforce' },
        { key: 'users', label: 'User accounts', value: users, hint: `${sessions} live sessions` },
        { key: 'departments', label: 'Departments', value: departments, hint: `${campuses} campuses` },
        { key: 'roles', label: 'Roles configured', value: roles, hint: 'RBAC registry' },
      ],
      charts: {
        staffType: byStaffType.map((s) => ({ name: s.staffType.replace('_', ' '), value: s._count._all })),
        joiningsByMonth: Object.entries(monthMap).map(([month, value]) => ({ month, value })).sort((a, b) => a.month.localeCompare(b.month)),
      },
      systemActivity: audit.map((a) => ({ action: a.action, module: a.module, summary: a.summary, createdAt: a.createdAt, actor: a.actorEmail })),
      workflowLoad: workflowLoad.map((w) => ({ docType: w.docType, count: w._count._all })),
    }
  }

  // ── Principal ────────────────────────────────────────────────────────
  private async principal(user: SessionUser) {
    const inst = { institutionId: user.institutionId }
    const [total, teaching, nonTeaching, technical, separations, newThisYear] = await Promise.all([
      this.prisma.employee.count({ where: { ...inst, status: { not: 'SEPARATED' } } }),
      this.prisma.employee.count({ where: { ...inst, status: { not: 'SEPARATED' }, staffType: 'TEACHING' } }),
      this.prisma.employee.count({ where: { ...inst, status: { not: 'SEPARATED' }, staffType: 'NON_TEACHING' } }),
      this.prisma.employee.count({ where: { ...inst, status: { not: 'SEPARATED' }, staffType: 'TECHNICAL' } }),
      this.prisma.employee.count({ where: { ...inst, separationDate: { gte: new Date(Date.now() - 365 * 24 * 3600 * 1000) } } }),
      this.prisma.employee.count({ where: { ...inst, joiningDate: { gte: new Date(Date.now() - 365 * 24 * 3600 * 1000) } } }),
    ])
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000)
    const deptAttendance = await this.prisma.attendanceRecord.groupBy({
      by: ['campusId', 'status'],
      where: { date: { gte: since }, employee: { status: { not: 'SEPARATED' } } },
      _count: { _all: true },
    })
    const attendanceRate = (() => {
      let present = 0, total2 = 0
      for (const row of deptAttendance) {
        if (['WEEKLY_OFF', 'HOLIDAY'].includes(row.status)) continue
        total2 += row._count._all
        if (['PRESENT', 'HALF_DAY', 'WFH', 'OFFICIAL_DUTY'].includes(row.status)) present += row._count._all
      }
      return total2 ? Math.round((present / total2) * 100) : 100
    })()
    const departments = await this.prisma.department.findMany({
      where: { ...inst },
      include: { _count: { select: { employees: { where: { status: { not: 'SEPARATED' } } } } }, hod: { select: { fullName: true } } },
      orderBy: { name: 'asc' },
    })
    const payrollRun = await this.prisma.payrollRun.findFirst({
      where: { ...inst, periodMonth: new Date().getUTCMonth() + 1, periodYear: new Date().getUTCFullYear() },
    })
    return {
      kpis: [
        { key: 'total', label: 'Workforce', value: total, hint: `${teaching} teaching · ${nonTeaching + technical} support` },
        { key: 'attendance', label: 'Attendance (30d)', value: attendanceRate, unit: '%', hint: 'institution-wide' },
        { key: 'newThisYear', label: 'Joinings (12m)', value: newThisYear, hint: `${separations} separations` },
        { key: 'payroll', label: 'Current payroll', value: payrollRun ? payrollRun.status.replace('_', ' ') : 'NOT STARTED', hint: payrollRun ? payrollRun.runNo : `${new Date().toLocaleString('en-IN', { month: 'long' })} run pending` },
      ],
      charts: {
        staffMix: [
          { name: 'Teaching', value: teaching },
          { name: 'Non-teaching', value: nonTeaching },
          { name: 'Technical', value: technical },
        ],
      },
      departments: departments.slice(0, 10).map((d) => ({
        name: d.name,
        hod: d.hod?.fullName ?? '—',
        employeeCount: d._count.employees,
      })),
      approvalsNeeded: (await this.engine.pendingFor(user)).slice(0, 6).map((i) => ({
        id: i.request.id, referenceNo: i.request.referenceNo, title: i.request.title, docType: i.request.docType, stage: i.stage.name,
      })),
    }
  }

  // ── HR Admin ────────────────────────────────────────────────────────
  private async hrAdmin(user: SessionUser) {
    const todayStr = new Date().toISOString().slice(0, 10)
    const today = new Date(`${todayStr}T00:00:00Z`)
    const inst = { institutionId: user.institutionId }
    const [onRoll, probation, pendingLeave, pendingCorrections, openVacancies, applicants, docExpiring] = await Promise.all([
      this.prisma.employee.count({ where: { ...inst, status: { not: 'SEPARATED' } } }),
      this.prisma.employee.count({ where: { ...inst, status: 'PROBATION' } }),
      this.prisma.leaveApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.attendanceCorrection.count({ where: { status: 'PENDING' } }),
      this.prisma.vacancy.count({ where: { ...inst, status: 'OPEN' } }),
      this.prisma.application.count({ where: { status: { in: ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED'] } } }),
      this.prisma.employeeDocument.count({ where: { expiresOn: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 3600 * 1000) } } }),
    ])
    const todayAttendance = await this.prisma.attendanceRecord.groupBy({ by: ['status'], where: { date: today }, _count: { _all: true } })
    const since = new Date(Date.now() - 13 * 24 * 3600 * 1000)
    const trend = await this.prisma.attendanceRecord.groupBy({ by: ['date', 'status'], where: { date: { gte: since } }, _count: { _all: true } })
    const dayMap: Record<string, { present: number; absent: number; leave: number }> = {}
    for (const t of trend) {
      const k = t.date.toISOString().slice(0, 10)
      const d = (dayMap[k] ??= { present: 0, absent: 0, leave: 0 })
      if (['PRESENT', 'HALF_DAY', 'WFH', 'OFFICIAL_DUTY'].includes(t.status)) d.present += t._count._all
      else if (t.status === 'ABSENT') d.absent += t._count._all
      else if (t.status === 'ON_LEAVE') d.leave += t._count._all
    }
    const probationExpiring = await this.prisma.employee.findMany({
      where: { ...inst, status: 'PROBATION', probationEndDate: { lte: new Date(Date.now() + 45 * 24 * 3600 * 1000) } },
      select: { employeeCode: true, fullName: true, probationEndDate: true },
      take: 8,
    })
    return {
      kpis: [
        { key: 'onRoll', label: 'Employees on roll', value: onRoll, hint: `${probation} on probation` },
        { key: 'pendingLeave', label: 'Pending leave requests', value: pendingLeave, hint: 'awaiting approval' },
        { key: 'pendingCorrections', label: 'Attendance corrections', value: pendingCorrections, hint: 'pending review' },
        { key: 'recruitment', label: 'Open vacancies', value: openVacancies, hint: `${applicants} candidates in pipeline` },
      ],
      charts: {
        attendanceTrend: Object.entries(dayMap).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
        today: Object.fromEntries(todayAttendance.map((t) => [t.status, t._count._all])),
      },
      probationExpiring: probationExpiring.map((p) => ({ code: p.employeeCode, name: p.fullName, date: p.probationEndDate })),
      docExpiring,
    }
  }

  // ── HOD ──────────────────────────────────────────────────────────────
  private async hod(user: SessionUser) {
    const deptIds = deptIdsOf(user)
    if (deptIds.length === 0) return { kpis: [], charts: {}, team: [], notices: ['No department assigned to your HOD role'] }
    const dept = await this.prisma.department.findUnique({ where: { id: deptIds[0] }, include: { hod: true, campus: true } })
    const [teamCount, onLeaveToday, pendingLeaveDept, corrections, workload] = await Promise.all([
      this.prisma.employee.count({ where: { departmentId: { in: deptIds }, status: { not: 'SEPARATED' } } }),
      this.prisma.leaveApplication.count({
        where: { status: 'APPROVED', employee: { departmentId: { in: deptIds } }, fromDate: { lte: new Date() }, toDate: { gte: new Date() } },
      }),
      this.prisma.leaveApplication.count({ where: { status: 'PENDING', employee: { departmentId: { in: deptIds } } } }),
      this.prisma.attendanceCorrection.count({ where: { status: 'PENDING', employee: { departmentId: { in: deptIds } } } }),
      this.prisma.workloadEntry.findMany({ where: { departmentId: { in: deptIds } }, include: { employee: { select: { fullName: true } } }, orderBy: { totalLoadPoints: 'desc' } }),
    ])
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000)
    const attendance = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: { date: { gte: since }, employee: { departmentId: { in: deptIds } } },
      _count: { _all: true },
    })
    let present = 0, total = 0
    for (const a of attendance) {
      if (['WEEKLY_OFF', 'HOLIDAY'].includes(a.status)) continue
      total += a._count._all
      if (['PRESENT', 'HALF_DAY', 'WFH', 'OFFICIAL_DUTY'].includes(a.status)) present += a._count._all
    }
    const rate = total ? Math.round((present / total) * 100) : 100
    const avgLoad = workload.length ? workload.reduce((s, w) => s + w.totalLoadPoints, 0) / workload.length : 0
    return {
      department: dept ? { name: dept.name, campus: dept.campus.name, hod: dept.hod?.fullName ?? '—' } : null,
      kpis: [
        { key: 'team', label: 'Department strength', value: teamCount, hint: dept?.name ?? '' },
        { key: 'attendance', label: 'Attendance (30d)', value: rate, unit: '%', hint: 'department' },
        { key: 'onLeave', label: 'On leave today', value: onLeaveToday, hint: `${pendingLeaveDept} pending requests` },
        { key: 'workload', label: 'Avg weekly load', value: Math.round(avgLoad * 10) / 10, hint: `${workload.filter((w) => w.isOverloaded).length} overloaded (norm 16h)` },
      ],
      charts: {
        workloadTop: workload.slice(0, 8).map((w) => ({ name: w.employee.fullName.split(' ').slice(0, 2).join(' '), hours: Math.round((w.teachingHours + w.labHours) * 10) / 10 })),
      },
      team: (await this.prisma.employee.findMany({
        where: { departmentId: { in: deptIds }, status: { not: 'SEPARATED' } },
        select: { employeeCode: true, fullName: true, designation: { select: { title: true } }, photoSeed: true },
        orderBy: { fullName: 'asc' },
        take: 12,
      })).map((t) => ({ code: t.employeeCode, name: t.fullName, designation: t.designation?.title ?? '', photoSeed: t.photoSeed })),
      corrections,
    }
  }

  // ── Accountant ───────────────────────────────────────────────────────
  private async accountant(user: SessionUser) {
    const now = new Date()
    const [currentRun, lastCompleted, runs, onHold, ytd] = await Promise.all([
      this.prisma.payrollRun.findFirst({
        where: { institutionId: user.institutionId, periodMonth: now.getUTCMonth() + 1, periodYear: now.getUTCFullYear() },
      }),
      this.prisma.payrollRun.findFirst({
        where: { institutionId: user.institutionId, status: 'COMPLETED' },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      }),
      this.prisma.payrollRun.findMany({
        where: { institutionId: user.institutionId },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
        take: 6,
        select: { id: true, runNo: true, periodMonth: true, periodYear: true, status: true, totalNet: true, employeeCount: true },
      }),
      this.prisma.payslip.count({ where: { status: 'ON_HOLD' } }),
      this.prisma.payrollRun.aggregate({
        where: { institutionId: user.institutionId, status: 'COMPLETED', periodYear: now.getUTCFullYear() },
        _sum: { totalNet: true },
      }),
    ])
    return {
      kpis: [
        { key: 'current', label: `${now.toLocaleString('en-IN', { month: 'long' })} payroll`, value: currentRun ? currentRun.status.replace('_', ' ') : 'NOT STARTED', hint: currentRun?.runNo ?? 'create a run' },
        { key: 'lastNet', label: 'Last disbursed net', value: lastCompleted?.totalNet ?? 0, format: 'INR', hint: lastCompleted ? `${lastCompleted.periodMonth}/${lastCompleted.periodYear}` : '—' },
        { key: 'ytd', label: 'Net paid (YTD)', value: ytd._sum.totalNet ?? 0, format: 'INR', hint: String(now.getUTCFullYear()) },
        { key: 'onHold', label: 'Payslips on hold', value: onHold, hint: 'review adjustments' },
      ],
      recentRuns: runs,
      charts: {
        costTrend: (await this.prisma.payrollRun.findMany({
          where: { institutionId: user.institutionId, status: 'COMPLETED' },
          orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
          take: 12,
          select: { periodMonth: true, periodYear: true, totalGross: true, totalNet: true },
        })).map((r) => ({ month: `${r.periodYear}-${String(r.periodMonth).padStart(2, '0')}`, gross: r.totalGross, net: r.totalNet })),
      },
    }
  }

  // ── Faculty / staff self-service ──────────────────────────────────────
  private async selfService(user: SessionUser) {
    const year = new Date().getFullYear()
    const monthStart = new Date(Date.UTC(year, new Date().getUTCMonth(), 1))
    const [monthRecords, balances, latestPayslip, docs, upcoming] = await Promise.all([
      this.prisma.attendanceRecord.findMany({ where: { employeeId: user.employeeId, date: { gte: monthStart } }, select: { status: true } }),
      this.prisma.leaveBalance.findMany({ where: { employeeId: user.employeeId, year }, include: { leaveType: true } }),
      this.prisma.payslip.findFirst({
        where: { employeeId: user.employeeId, status: { in: ['RELEASED', 'PAID'] } },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      }),
      this.prisma.employeeDocument.count({ where: { employeeId: user.employeeId, expiresOn: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 3600 * 1000) } } }),
      this.prisma.leaveApplication.findMany({
        where: { employeeId: user.employeeId, status: { in: ['PENDING', 'RETURNED'] } },
        orderBy: { appliedAt: 'desc' },
        take: 4,
        include: { leaveType: { select: { name: true } } },
      }),
    ])
    const presentDays = monthRecords.filter((r) => ['PRESENT', 'HALF_DAY', 'WFH', 'OFFICIAL_DUTY'].includes(r.status)).length
    let workloadSummary = null
    if (user.activeRoleKey === 'FACULTY') {
      const term = await this.prisma.academicTerm.findFirst({ where: { institutionId: user.institutionId, isActive: true } })
      if (term) {
        const [subjects, wl] = await Promise.all([
          this.prisma.subjectAllocation.findMany({ where: { termId: term.id, employeeId: user.employeeId } }),
          this.prisma.workloadEntry.findUnique({ where: { termId_employeeId: { termId: term.id, employeeId: user.employeeId } } }),
        ])
        workloadSummary = {
          term: term.name,
          subjects: subjects.length,
          teachingHours: wl ? Math.round((wl.teachingHours + wl.labHours) * 10) / 10 : subjects.reduce((s, x) => s + x.lectureHours + x.labHours, 0),
          overloaded: wl?.isOverloaded ?? false,
        }
      }
    }
    const cycle = await this.prisma.appraisalCycle.findFirst({
      where: { institutionId: user.institutionId, status: { in: ['ACTIVE', 'REVIEW_UNDERWAY'] } },
    })
    let appraisalStatus: { name: string; status: string; goals: number; goalProgress: number } | null = null
    if (cycle) {
      const [goals, review] = await Promise.all([
        this.prisma.goal.findMany({ where: { cycleId: cycle.id, employeeId: user.employeeId } }),
        this.prisma.performanceReview.findUnique({ where: { cycleId_employeeId: { cycleId: cycle.id, employeeId: user.employeeId } } }),
      ])
      appraisalStatus = {
        name: cycle.name,
        status: review?.status ?? 'PENDING',
        goals: goals.length,
        goalProgress: goals.length ? Math.round(goals.reduce((s, g) => s + g.completionPercent, 0) / goals.length) : 0,
      }
    }
    return {
      kpis: [
        { key: 'attendance', label: 'Present days (month)', value: presentDays, hint: monthRecords.length ? `${monthRecords.length} recorded days` : 'attendance pending' },
        { key: 'leaveBalance', label: 'Leave available', value: Math.round(balances.reduce((s, b) => s + Math.max(0, b.entitled + b.carriedForward - b.usedDays - b.pendingDays), 0) * 10) / 10, hint: 'all categories' },
        ...(latestPayslip ? [{ key: 'netPay', label: `Net pay (${latestPayslip.periodMonth}/${latestPayslip.periodYear})`, value: latestPayslip.netPay, format: 'INR', hint: 'latest payslip' }] : []),
        { key: 'documents', label: 'Docs expiring ≤30d', value: docs, hint: 'renewals due' },
      ],
      charts: {
        leaveBalances: balances.map((b) => ({
          name: b.leaveType.code,
          available: Math.max(0, Math.round((b.entitled + b.carriedForward - b.usedDays - b.pendingDays) * 10) / 10),
          used: b.usedDays,
        })),
      },
      myRequests: upcoming.map((u) => ({
        referenceNo: u.referenceNo, type: u.leaveType.name, fromDate: u.fromDate, toDate: u.toDate, days: u.days, status: u.status,
      })),
      workloadSummary,
      appraisalStatus,
    }
  }
}
