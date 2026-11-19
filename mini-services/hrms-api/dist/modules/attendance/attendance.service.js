"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = exports.CorrectionDto = exports.ManualEntryDto = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../core/audit/audit.service");
const approval_engine_service_1 = require("../../core/approvals/approval-engine.service");
const scope_1 = require("../../core/scope");
const envelope_1 = require("../../core/http/envelope");
class ManualEntryDto {
    employeeCode;
    date;
    status;
    inTime;
    outTime;
    remarks;
}
exports.ManualEntryDto = ManualEntryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ManualEntryDto.prototype, "employeeCode", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ManualEntryDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.AttendanceStatus),
    __metadata("design:type", String)
], ManualEntryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ManualEntryDto.prototype, "inTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ManualEntryDto.prototype, "outTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ManualEntryDto.prototype, "remarks", void 0);
class CorrectionDto {
    date;
    requestedIn;
    requestedOut;
    reason;
}
exports.CorrectionDto = CorrectionDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CorrectionDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CorrectionDto.prototype, "requestedIn", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CorrectionDto.prototype, "requestedOut", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], CorrectionDto.prototype, "reason", void 0);
const dayStart = (d) => new Date(`${d}T00:00:00Z`);
const dayEnd = (d) => new Date(new Date(`${d}T00:00:00Z`).getTime() + 24 * 3600 * 1000);
const combine = (d, hm) => (hm ? new Date(`${d}T${hm.length === 5 ? hm : hm + ':00'}Z`) : null);
let AttendanceService = class AttendanceService {
    prisma;
    audit;
    engine;
    constructor(prisma, audit, engine) {
        this.prisma = prisma;
        this.audit = audit;
        this.engine = engine;
    }
    async scopedEmployeeWhere(user) {
        const scope = (0, scope_1.scopeFor)(user, 'attendance:read_all', 'attendance:read_dept', 'attendance:read_self');
        if (scope.kind === 'ALL')
            return {};
        if (scope.kind === 'DEPT')
            return { departmentId: { in: scope.departmentIds } };
        return { id: user.employeeId };
    }
    async dayView(date, departmentId, campusId, user) {
        const employeeWhere = await this.scopedEmployeeWhere(user);
        const emp = await this.prisma.employee.findMany({
            where: { ...employeeWhere, ...(departmentId ? { departmentId } : {}), ...(campusId ? { campusId } : {}) },
            select: { id: true, employeeCode: true, fullName: true, departmentId: true, department: { select: { name: true } }, campusId: true },
        });
        const empIds = emp.map((e) => e.id);
        const records = await this.prisma.attendanceRecord.findMany({
            where: { employeeId: { in: empIds }, date: dayStart(date) },
        });
        const byEmp = new Map(records.map((r) => [r.employeeId, r]));
        const punches = await this.prisma.punchRecord.findMany({
            where: { employeeId: { in: empIds }, timestamp: { gte: dayStart(date), lt: dayEnd(date) } },
            orderBy: { timestamp: 'asc' },
        });
        const punchesByEmp = new Map();
        for (const p of punches) {
            const list = punchesByEmp.get(p.employeeId) ?? [];
            list.push(p);
            punchesByEmp.set(p.employeeId, list);
        }
        const rows = emp.map((e) => {
            const r = byEmp.get(e.id);
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
            };
        });
        const anomalies = [];
        for (const e of emp) {
            const r = byEmp.get(e.id);
            const p = punchesByEmp.get(e.id) ?? [];
            if (!r && p.length > 0) {
                anomalies.push({ type: 'PUNCH_NO_RECORD', employeeCode: e.employeeCode, name: e.fullName, detail: `${p.length} punch(es) with no attendance record` });
            }
            if (r && (r.status === 'PRESENT' || r.status === 'HALF_DAY')) {
                if (!r.inTime && p.length === 0)
                    anomalies.push({ type: 'MISSING_IN', employeeCode: e.employeeCode, name: e.fullName, detail: 'No in-time or punches for a present day' });
                if (!r.outTime && p.length <= 1)
                    anomalies.push({ type: 'MISSING_OUT', employeeCode: e.employeeCode, name: e.fullName, detail: 'No out-time recorded' });
            }
        }
        const counts = {};
        for (const row of rows)
            counts[row.status] = (counts[row.status] ?? 0) + 1;
        return { date, rows, counts, anomalies, total: rows.length };
    }
    async overview(user) {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const employeeWhere = await this.scopedEmployeeWhere(user);
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
        ]);
        const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));
        const since = dayStart(new Date(Date.now() - 13 * 24 * 3600 * 1000).toISOString().slice(0, 10));
        const trendRows = await this.prisma.attendanceRecord.findMany({
            where: { date: { gte: since }, employee: employeeWhere },
            select: { date: true, status: true },
        });
        const trend = {};
        for (const r of trendRows) {
            const key = r.date.toISOString().slice(0, 10);
            const t = (trend[key] ??= { present: 0, absent: 0, onLeave: 0, off: 0 });
            if (r.status === 'PRESENT' || r.status === 'HALF_DAY' || r.status === 'WFH' || r.status === 'OFFICIAL_DUTY')
                t.present++;
            else if (r.status === 'ABSENT')
                t.absent++;
            else if (r.status === 'ON_LEAVE')
                t.onLeave++;
            else
                t.off++;
        }
        const series = Object.entries(trend)
            .map(([date, t]) => ({ date, ...t }))
            .sort((a, b) => a.date.localeCompare(b.date));
        return { date: todayStr, counts, series };
    }
    async monthly(month, year, user, departmentId) {
        const from = new Date(Date.UTC(year, month - 1, 1));
        const to = new Date(Date.UTC(year, month, 1));
        const employeeWhere = await this.scopedEmployeeWhere(user);
        const employees = await this.prisma.employee.findMany({
            where: { ...employeeWhere, ...(departmentId ? { departmentId } : {}) },
            select: { id: true, employeeCode: true, fullName: true, departmentId: true, department: { select: { name: true } } },
            orderBy: { fullName: 'asc' },
        });
        const empIds = employees.map((e) => e.id);
        const records = await this.prisma.attendanceRecord.findMany({
            where: { employeeId: { in: empIds }, date: { gte: from, lt: to } },
            select: { employeeId: true, date: true, status: true, inTime: true },
        });
        const perDay = {};
        const perEmp = new Map();
        for (const e of employees)
            perEmp.set(e.id, { present: 0, halfDay: 0, absent: 0, onLeave: 0, offDuty: 0, off: 0, late: 0 });
        for (const r of records) {
            const dayKey = r.date.toISOString().slice(0, 10);
            const day = (perDay[dayKey] ??= { present: 0, absent: 0, onLeave: 0, off: 0, total: 0 });
            day.total++;
            const emp = perEmp.get(r.employeeId);
            if (r.status === 'PRESENT') {
                day.present++;
                emp.present++;
            }
            else if (r.status === 'HALF_DAY') {
                day.present++;
                emp.halfDay++;
            }
            else if (r.status === 'WFH' || r.status === 'OFFICIAL_DUTY') {
                day.present++;
                emp.offDuty++;
            }
            else if (r.status === 'ABSENT') {
                day.absent++;
                emp.absent++;
            }
            else if (r.status === 'ON_LEAVE') {
                day.onLeave++;
                emp.onLeave++;
            }
            else {
                day.off++;
                emp.off++;
            }
            if (r.inTime && r.inTime.getUTCHours() >= 10 && (r.status === 'PRESENT' || r.status === 'HALF_DAY'))
                emp.late++;
        }
        const days = Object.entries(perDay).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date));
        const byDepartment = new Map();
        for (const e of employees) {
            const emp = perEmp.get(e.id);
            const deptName = e.department?.name ?? '—';
            const agg = byDepartment.get(e.departmentId ?? 'none') ?? { department: deptName, present: 0, absent: 0, onLeave: 0, total: 0 };
            agg.present += emp.present + emp.halfDay + emp.offDuty;
            agg.absent += emp.absent;
            agg.onLeave += emp.onLeave;
            agg.total += emp.present + emp.halfDay + emp.absent + emp.onLeave + emp.offDuty;
            byDepartment.set(e.departmentId ?? 'none', agg);
        }
        const rows = employees.map((e) => {
            const emp = perEmp.get(e.id);
            const working = emp.present + emp.halfDay + emp.absent + emp.onLeave + emp.offDuty;
            const attended = emp.present + emp.halfDay + emp.offDuty;
            return {
                employeeCode: e.employeeCode,
                name: e.fullName,
                department: e.department?.name ?? null,
                present: emp.present, halfDay: emp.halfDay, absent: emp.absent, onLeave: emp.onLeave,
                offDuty: emp.offDuty, off: emp.off, late: emp.late,
                rate: working ? Math.round((attended / working) * 100) : 100,
            };
        });
        const rates = rows.filter((r) => r.present + r.halfDay + r.absent + r.onLeave > 0).map((r) => r.rate);
        return {
            month, year,
            days,
            byDepartment: [...byDepartment.values()].filter((d) => d.total > 0),
            employees: rows.sort((a, b) => a.rate - b.rate).slice(0, 60),
            averageRate: rates.length ? Math.round(rates.reduce((s, r) => s + r, 0) / rates.length) : 100,
            lowAttendance: rows.filter((r) => r.rate < 80).slice(0, 15),
        };
    }
    async self(from, to, user) {
        const records = await this.prisma.attendanceRecord.findMany({
            where: { employeeId: user.employeeId, date: { gte: dayStart(from), lte: dayStart(to) } },
            orderBy: { date: 'desc' },
        });
        const punches = await this.prisma.punchRecord.findMany({
            where: { employeeId: user.employeeId, timestamp: { gte: new Date(Date.now() - 3 * 24 * 3600 * 1000) } },
            orderBy: { timestamp: 'desc' },
            take: 40,
        });
        const corrections = await this.prisma.attendanceCorrection.findMany({
            where: { employeeId: user.employeeId },
            orderBy: { appliedAt: 'desc' },
            take: 20,
        });
        const month = new Date().toISOString().slice(0, 7);
        const monthRecords = records.filter((r) => r.date.toISOString().slice(0, 7) === month);
        const presentish = monthRecords.filter((r) => ['PRESENT', 'HALF_DAY', 'WFH', 'OFFICIAL_DUTY'].includes(r.status)).length;
        return {
            records: records.map((r) => ({ date: r.date, status: r.status, inTime: r.inTime, outTime: r.outTime, workedHours: r.workedHours, isManual: r.isManual, source: r.source })),
            punches: punches.map((p) => ({ timestamp: p.timestamp, direction: p.direction, source: p.source })),
            corrections: corrections.map((c) => ({ referenceNo: c.referenceNo, date: c.date, status: c.status, reason: c.reason, requestedIn: c.requestedIn, requestedOut: c.requestedOut, appliedAt: c.appliedAt })),
            monthStats: { month, presentDays: presentish, recordedDays: monthRecords.length },
        };
    }
    async manualEntry(dto, user) {
        let employeeId = user.employeeId;
        let employeeName = null;
        if (dto.employeeCode && dto.employeeCode !== user.employeeCode) {
            const target = await this.prisma.employee.findUnique({ where: { employeeCode: dto.employeeCode } });
            if (!target)
                throw new envelope_1.NotFoundError(`Employee ${dto.employeeCode} not found`);
            const scope = (0, scope_1.scopeFor)(user, 'attendance:read_all', 'attendance:read_dept', 'attendance:read_self');
            if (scope.kind === 'DEPT' && (!target.departmentId || !scope.departmentIds.includes(target.departmentId))) {
                throw new envelope_1.ForbiddenError('You can only mark attendance for your department');
            }
            employeeId = target.id;
            employeeName = target.fullName;
        }
        const inT = combine(dto.date, dto.inTime ?? undefined);
        const outT = combine(dto.date, dto.outTime ?? undefined);
        const workedHours = inT && outT ? Math.max(0, (outT.getTime() - inT.getTime()) / 3600000) : null;
        await this.prisma.attendanceRecord.upsert({
            where: { employeeId_date: { employeeId, date: dayStart(dto.date) } },
            create: {
                employeeId, campusId: (await this.prisma.employee.findUnique({ where: { id: employeeId }, select: { campusId: true } })).campusId,
                date: dayStart(dto.date), status: dto.status, inTime: inT, outTime: outT, workedHours,
                isManual: true, source: 'MANUAL', remarks: dto.remarks ?? null,
            },
            update: { status: dto.status, inTime: inT, outTime: outT, workedHours, isManual: true, source: 'MANUAL', remarks: dto.remarks ?? null },
        });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'ATTENDANCE_MANUAL_ENTRY', module: 'attendance',
            entityType: 'AttendanceRecord', entityId: `${employeeId}:${dto.date}`,
            summary: `Manual entry for ${employeeName ?? user.name} on ${dto.date} (${dto.status})`,
        });
        return { ok: true };
    }
    async requestCorrection(dto, user) {
        const record = await this.prisma.attendanceRecord.findUnique({
            where: { employeeId_date: { employeeId: user.employeeId, date: dayStart(dto.date) } },
        });
        if (!record && dto.requestedIn == null && dto.requestedOut == null) {
            throw new envelope_1.BadRequestError('Provide requested in/out times — no attendance exists for this date');
        }
        if (record && (!dto.requestedIn && !dto.requestedOut)) {
            throw new envelope_1.BadRequestError('Provide the corrected in-time or out-time');
        }
        const dup = await this.prisma.attendanceCorrection.findFirst({
            where: { employeeId: user.employeeId, date: dayStart(dto.date), status: 'PENDING' },
        });
        if (dup)
            throw new envelope_1.BadRequestError(`Correction ${dup.referenceNo} is already pending for this date`);
        const employee = (await this.prisma.employee.findUnique({ where: { id: user.employeeId }, include: { department: true } }));
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
        });
        const request = await this.engine.submit({
            docType: 'ATTENDANCE_CORRECTION',
            docId: correction.id,
            title: `Correction for ${dto.date}`,
            institutionId: user.institutionId,
            initiatedByUserId: user.userId,
            initiatorName: employee.fullName,
            contextDepartmentId: employee.departmentId,
        });
        await this.prisma.attendanceCorrection.update({ where: { id: correction.id }, data: { approvalRequestId: request.id } });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'ATTENDANCE_CORRECTION_REQUESTED', module: 'attendance',
            entityType: 'AttendanceCorrection', entityId: correction.id,
            summary: `Correction requested for ${dto.date}: ${dto.reason.slice(0, 80)}`,
        });
        return { referenceNo: correction.referenceNo, approvalRef: request.referenceNo };
    }
    async corrections(user, status) {
        const scope = (0, scope_1.scopeFor)(user, 'attendance:read_all', 'attendance:read_dept', 'attendance:read_self');
        const where = {};
        if (status)
            where.status = status;
        if (scope.kind === 'SELF')
            where.employeeId = user.employeeId;
        else if (scope.kind === 'DEPT')
            where.employee = { departmentId: { in: scope.departmentIds } };
        const rows = await this.prisma.attendanceCorrection.findMany({
            where,
            orderBy: { appliedAt: 'desc' },
            take: 100,
            include: { employee: { include: { department: true } } },
        });
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
        }));
    }
    async applyCorrectionOutcome(correctionId, outcome, note) {
        const c = await this.prisma.attendanceCorrection.findUnique({ where: { id: correctionId } });
        if (!c)
            return;
        await this.prisma.attendanceCorrection.update({
            where: { id: correctionId },
            data: { status: outcome, decidedAt: new Date(), decisionNote: note },
        });
        if (outcome === 'APPROVED') {
            const dateKey = c.date.toISOString().slice(0, 10);
            const inT = c.requestedIn;
            const outT = c.requestedOut;
            const worked = inT && outT ? Math.max(0, (outT.getTime() - inT.getTime()) / 3600000) : null;
            const existing = await this.prisma.attendanceRecord.findUnique({
                where: { employeeId_date: { employeeId: c.employeeId, date: c.date } },
            });
            if (existing) {
                await this.prisma.attendanceRecord.update({
                    where: { id: existing.id },
                    data: {
                        inTime: inT ?? existing.inTime,
                        outTime: outT ?? existing.outTime,
                        workedHours: worked ?? existing.workedHours,
                        isManual: true,
                        source: 'MANUAL',
                        remarks: `Corrected per ${c.referenceNo}`,
                    },
                });
            }
            else {
                await this.prisma.attendanceRecord.create({
                    data: {
                        employeeId: c.employeeId,
                        campusId: (await this.prisma.employee.findUnique({ where: { id: c.employeeId }, select: { campusId: true } })).campusId,
                        date: c.date,
                        status: 'PRESENT',
                        inTime: inT,
                        outTime: outT,
                        workedHours: worked,
                        isManual: true,
                        source: 'MANUAL',
                        remarks: `Created per approved correction ${c.referenceNo}`,
                    },
                });
            }
        }
    }
    async markLeaveAttendance(employeeId, fromISO, toISO) {
        const employee = await this.prisma.employee.findUnique({ where: { id: employeeId }, select: { campusId: true } });
        if (!employee)
            return;
        const from = new Date(fromISO);
        const to = new Date(toISO);
        for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 24 * 3600 * 1000)) {
            const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
            const existing = await this.prisma.attendanceRecord.findUnique({ where: { employeeId_date: { employeeId, date: day } } });
            if (existing && (existing.status === 'HOLIDAY' || existing.status === 'WEEKLY_OFF'))
                continue;
            if (existing) {
                await this.prisma.attendanceRecord.update({ where: { id: existing.id }, data: { status: 'ON_LEAVE' } });
            }
            else {
                await this.prisma.attendanceRecord.create({
                    data: { employeeId, campusId: employee.campusId, date: day, status: 'ON_LEAVE', source: 'SYSTEM' },
                });
            }
        }
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, approval_engine_service_1.ApprovalEngine])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map