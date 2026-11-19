import { Injectable } from '@nestjs/common'
import { Response } from 'express'
import { PrismaService } from '../../prisma/prisma.service'
import { SessionUser } from '../../core/auth/auth.types'
import { deptIdsOf } from '../../core/scope'
import { ok } from '../../core/http/envelope'

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async headcount(user: SessionUser) {
    const deptIds = user.permissions.includes('reports:read') ? [] : deptIdsOf(user)
    const where = deptIds.length ? { departmentId: { in: deptIds } } : {}
    const [byDept, byCampus, byStaff, byStatus, byDesignation, byGender] = await Promise.all([
      this.prisma.employee.groupBy({ by: ['departmentId'], where, _count: { _all: true } }),
      this.prisma.employee.groupBy({ by: ['campusId'], where, _count: { _all: true } }),
      this.prisma.employee.groupBy({ by: ['staffType'], where, _count: { _all: true } }),
      this.prisma.employee.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.employee.groupBy({ by: ['designationId'], where: { ...where, status: { not: 'SEPARATED' } }, _count: { _all: true } }),
      this.prisma.employee.groupBy({ by: ['gender'], where: { ...where, status: { not: 'SEPARATED' } }, _count: { _all: true } }),
    ])
    const [departments, campuses, designations] = await Promise.all([
      this.prisma.department.findMany({ where: { institutionId: user.institutionId }, select: { id: true, name: true } }),
      this.prisma.campus.findMany({ where: { institutionId: user.institutionId }, select: { id: true, name: true } }),
      this.prisma.designation.findMany({ where: { institutionId: user.institutionId }, select: { id: true, title: true, category: true } }),
    ])
    const deptName = new Map(departments.map((d) => [d.id, d.name]))
    const campusName = new Map(campuses.map((d) => [d.id, d.name]))
    const desigTitle = new Map(designations.map((d) => [d.id, d.title]))

    const joinings = await this.prisma.employee.findMany({
      where: { ...where, joiningDate: { gte: new Date(Date.now() - 365 * 24 * 3600 * 1000) } },
      select: { joiningDate: true },
    })
    const separations = await this.prisma.employee.findMany({
      where: { ...where, separationDate: { gte: new Date(Date.now() - 365 * 24 * 3600 * 1000) } },
      select: { separationDate: true },
    })
    const monthKey = (d: Date) => d.toISOString().slice(0, 7)
    const flow: Record<string, { joined: number; separated: number }> = {}
    for (const e of joinings) {
      const k = monthKey(e.joiningDate)
      ;(flow[k] ??= { joined: 0, separated: 0 }).joined++
    }
    for (const e of separations) {
      const k = monthKey(e.separationDate!)
      ;(flow[k] ??= { joined: 0, separated: 0 }).separated++
    }

    const ages = await this.prisma.employee.findMany({ where: { ...where, status: { not: 'SEPARATED' } }, select: { dateOfBirth: true, joiningDate: true } })
    const ageBands = { '<30': 0, '30-40': 0, '40-50': 0, '50+': 0 }
    const tenureBands = { '<2': 0, '2-5': 0, '5-10': 0, '10+': 0 }
    for (const e of ages) {
      const age = (Date.now() - e.dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000)
      if (age < 30) ageBands['<30']++
      else if (age < 40) ageBands['30-40']++
      else if (age < 50) ageBands['40-50']++
      else ageBands['50+']++
      const tenure = (Date.now() - e.joiningDate.getTime()) / (365.25 * 24 * 3600 * 1000)
      if (tenure < 2) tenureBands['<2']++
      else if (tenure < 5) tenureBands['2-5']++
      else if (tenure < 10) tenureBands['5-10']++
      else tenureBands['10+']++
    }

    return {
      byDepartment: byDept.map((d) => ({ department: deptName.get(d.departmentId ?? '') ?? '—', count: d._count._all })).sort((a, b) => b.count - a.count),
      byCampus: byCampus.map((d) => ({ campus: campusName.get(d.campusId) ?? '—', count: d._count._all })),
      byStaffType: byStaff.map((d) => ({ staffType: d.staffType, count: d._count._all })),
      byStatus: byStatus.map((d) => ({ status: d.status, count: d._count._all })),
      byDesignationCategory: byDesignation
        .map((b) => ({
          title: desigTitle.get(b.designationId ?? '') ?? '—',
          category: designations.find((d) => d.id === b.designationId)?.category ?? '—',
          count: b._count._all,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
      byGender: byGender.map((d) => ({ gender: d.gender, count: d._count._all })),
      ageBands,
      tenureBands,
      flow: Object.entries(flow).map(([month, v]) => ({ month, ...v })).sort((a, b) => a.month.localeCompare(b.month)),
    }
  }

  async attendanceReport(month: number, year: number, user: SessionUser) {
    const from = new Date(Date.UTC(year, month - 1, 1))
    const to = new Date(Date.UTC(year, month, 1))
    const deptIds = user.permissions.includes('reports:read') ? [] : deptIdsOf(user)
    const where = {
      date: { gte: from, lt: to },
      ...(deptIds.length ? { employee: { departmentId: { in: deptIds } } } : {}),
    }
    const grouped = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    })
    const daily = await this.prisma.attendanceRecord.groupBy({
      by: ['date', 'status'],
      where,
      _count: { _all: true },
    })
    const dayMap: Record<string, Record<string, number>> = {}
    for (const d of daily) {
      const key = d.date.toISOString().slice(0, 10)
      ;(dayMap[key] ??= {})[d.status] = d._count._all
    }
    const series = Object.entries(dayMap)
      .map(([date, s]) => ({
        date,
        present: (s.PRESENT ?? 0) + (s.HALF_DAY ?? 0) + (s.WFH ?? 0) + (s.OFFICIAL_DUTY ?? 0),
        absent: s.ABSENT ?? 0,
        onLeave: s.ON_LEAVE ?? 0,
        off: (s.WEEKLY_OFF ?? 0) + (s.HOLIDAY ?? 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
    return {
      month, year,
      totals: Object.fromEntries(grouped.map((g) => [g.status, g._count._all])),
      series,
    }
  }

  async leaveReport(year: number, user: SessionUser) {
    const deptIds = user.permissions.includes('reports:read') ? [] : deptIdsOf(user)
    const where = {
      balanceYear: year,
      ...(deptIds.length ? { employee: { departmentId: { in: deptIds } } } : {}),
    }
    const byType = await this.prisma.leaveApplication.groupBy({
      by: ['leaveTypeId', 'status'],
      where,
      _count: { _all: true },
      _sum: { days: true },
    })
    const types = await this.prisma.leaveType.findMany({ where: { institutionId: user.institutionId } })
    const typeMap = new Map(types.map((t) => [t.id, t]))
    const merged = new Map<string, { type: string; applications: number; days: number; approved: number; pending: number }>()
    for (const row of byType) {
      const t = typeMap.get(row.leaveTypeId)!
      const agg = merged.get(t.name) ?? { type: t.name, applications: 0, days: 0, approved: 0, pending: 0 }
      agg.applications += row._count._all
      agg.days += row._sum.days ?? 0
      if (row.status === 'APPROVED') agg.approved += row._count._all
      if (row.status === 'PENDING') agg.pending += row._count._all
      merged.set(t.name, agg)
    }
    const monthly = await this.prisma.leaveApplication.findMany({
      where,
      select: { appliedAt: true, days: true },
    })
    const monthMap: Record<string, { applications: number; days: number }> = {}
    for (const m of monthly) {
      const k = m.appliedAt.toISOString().slice(0, 7)
      const agg = (monthMap[k] ??= { applications: 0, days: 0 })
      agg.applications++
      agg.days += m.days
    }
    const top = await this.prisma.leaveApplication.findMany({
      where: { ...where, status: 'APPROVED' },
      orderBy: { days: 'desc' },
      take: 10,
      include: { employee: { select: { fullName: true, employeeCode: true, department: { select: { name: true } } } }, leaveType: { select: { name: true } } },
    })
    return {
      year,
      byType: [...merged.values()].sort((a, b) => b.days - a.days),
      top: top.map((t) => ({
        employee: t.employee.fullName, employeeCode: t.employee.employeeCode,
        department: t.employee.department?.name ?? null, type: t.leaveType.name,
        days: t.days, fromDate: t.fromDate, toDate: t.toDate,
      })),
      monthly: Object.entries(monthMap).map(([month, v]) => ({ month, ...v })).sort((a, b) => a.month.localeCompare(b.month)),
    }
  }

  async payrollReport(year: number, user: SessionUser) {
    const runs = await this.prisma.payrollRun.findMany({
      where: { institutionId: user.institutionId, periodYear: year },
      orderBy: [{ periodMonth: 'asc' }],
      select: { periodMonth: true, status: true, employeeCount: true, totalGross: true, totalDeductions: true, totalNet: true },
    })
    const deptSpend = await this.prisma.payslip.aggregate({
      where: { periodYear: year },
      _sum: { grossEarnings: true, netPay: true },
    })
    return {
      year,
      runs,
      totals: {
        gross: runs.filter((r) => r.status === 'COMPLETED').reduce((s, r) => s + r.totalGross, 0),
        net: runs.filter((r) => r.status === 'COMPLETED').reduce((s, r) => s + r.totalNet, 0),
        deductions: runs.filter((r) => r.status === 'COMPLETED').reduce((s, r) => s + r.totalDeductions, 0),
        allTime: deptSpend._sum,
      },
    }
  }

  /** CSV export of the employee directory. */
  async directoryCsv(user: SessionUser, res: Response) {
    const rows = await this.prisma.employee.findMany({
      where: { institutionId: user.institutionId, status: { in: ['ACTIVE', 'PROBATION', 'ON_NOTICE', 'ON_LONG_LEAVE'] } },
      include: { designation: true, department: true, campus: true },
      orderBy: { employeeCode: 'asc' },
    })
    const header = ['Employee Code', 'Name', 'Designation', 'Department', 'Campus', 'Staff Type', 'Employment Type', 'Status', 'Joining Date', 'Official Email', 'Phone']
    const lines = rows.map((r) =>
      [
        r.employeeCode, r.fullName, r.designation?.title ?? '', r.department?.name ?? '', r.campus?.name ?? '',
        r.staffType, r.employmentType, r.status, r.joiningDate.toISOString().slice(0, 10), r.officialEmail, r.phone,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    )
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="employee-directory-${new Date().toISOString().slice(0, 10)}.csv"`)
    res.send([header.join(','), ...lines].join('\n'))
    return res
  }
}
