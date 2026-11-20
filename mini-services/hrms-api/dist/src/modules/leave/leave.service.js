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
exports.LeaveService = exports.UpdateLeaveApplicationDto = exports.ApplyLeaveDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../core/audit/audit.service");
const approval_engine_service_1 = require("../../core/approvals/approval-engine.service");
const scope_1 = require("../../core/scope");
const envelope_1 = require("../../core/http/envelope");
class ApplyLeaveDto {
    leaveTypeId;
    fromDate;
    toDate;
    isHalfDayStart;
    isHalfDayEnd;
    reason;
    contactDuringLeave;
}
exports.ApplyLeaveDto = ApplyLeaveDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "leaveTypeId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "fromDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "toDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ApplyLeaveDto.prototype, "isHalfDayStart", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ApplyLeaveDto.prototype, "isHalfDayEnd", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(400),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "contactDuringLeave", void 0);
class UpdateLeaveApplicationDto {
    fromDate;
    toDate;
    reason;
    contactDuringLeave;
}
exports.UpdateLeaveApplicationDto = UpdateLeaveApplicationDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateLeaveApplicationDto.prototype, "fromDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateLeaveApplicationDto.prototype, "toDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(400),
    __metadata("design:type", String)
], UpdateLeaveApplicationDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateLeaveApplicationDto.prototype, "contactDuringLeave", void 0);
const dayStart = (d) => new Date(`${d}T00:00:00Z`);
const daysBetween = (from, to, halfStart = false, halfEnd = false) => {
    const ms = dayStart(to).getTime() - dayStart(from).getTime();
    if (ms < 0)
        return -1;
    let days = ms / (24 * 3600 * 1000) + 1;
    if (days === 1) {
        if (halfStart || halfEnd)
            days = 0.5;
    }
    else {
        if (halfStart)
            days -= 0.5;
        if (halfEnd)
            days -= 0.5;
    }
    return days;
};
let LeaveService = class LeaveService {
    prisma;
    audit;
    engine;
    constructor(prisma, audit, engine) {
        this.prisma = prisma;
        this.audit = audit;
        this.engine = engine;
    }
    async types(user) {
        const rows = await this.prisma.leaveType.findMany({
            where: { institutionId: user.institutionId, isActive: true },
            orderBy: { name: 'asc' },
        });
        return rows;
    }
    async balances(user, employeeCode) {
        let employeeId = user.employeeId;
        if (employeeCode && employeeCode !== user.employeeCode) {
            const scope = (0, scope_1.scopeFor)(user, 'leave:read_all', 'leave:read_dept', 'leave:read_self');
            const target = await this.prisma.employee.findUnique({
                where: { employeeCode },
                include: { department: true },
            });
            if (!target)
                throw new envelope_1.NotFoundError('Employee not found');
            if (scope.kind === 'SELF' && target.id !== user.employeeId)
                throw new envelope_1.ForbiddenError();
            if (scope.kind === 'DEPT' && (!target.departmentId || !scope.departmentIds.includes(target.departmentId))) {
                throw new envelope_1.ForbiddenError('Outside your department scope');
            }
            employeeId = target.id;
        }
        const year = new Date().getFullYear();
        const rows = await this.prisma.leaveBalance.findMany({
            where: { employeeId, year },
            include: { leaveType: true },
            orderBy: { leaveType: { name: 'asc' } },
        });
        const employee = await this.prisma.employee.findUnique({ where: { id: employeeId }, select: { staffType: true } });
        const types = await this.prisma.leaveType.findMany({ where: { institutionId: user.institutionId, isActive: true } });
        const present = new Set(rows.map((r) => r.leaveTypeId));
        const missing = types.filter((t) => !present.has(t.id) && ((t.applicableTo === 'ALL') ||
            (employee?.staffType === 'TEACHING' && t.applicableTo === 'TEACHING_ONLY') ||
            (employee?.staffType !== 'TEACHING' && t.applicableTo === 'NON_TEACHING_ONLY')));
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
        };
    }
    async apply(dto, user) {
        const type = await this.prisma.leaveType.findUnique({ where: { id: dto.leaveTypeId } });
        if (!type || !type.isActive)
            throw new envelope_1.BadRequestError('Unknown leave type');
        const employee = await this.prisma.employee.findUnique({
            where: { id: user.employeeId },
            include: { department: true },
        });
        if (!employee)
            throw new envelope_1.NotFoundError();
        if (type.applicableTo === 'TEACHING_ONLY' && employee.staffType !== 'TEACHING') {
            throw new envelope_1.BadRequestError(`${type.name} applies to teaching staff only`);
        }
        if (type.applicableTo === 'NON_TEACHING_ONLY' && employee.staffType === 'TEACHING') {
            throw new envelope_1.BadRequestError(`${type.name} applies to non-teaching staff only`);
        }
        const days = daysBetween(dto.fromDate, dto.toDate, dto.isHalfDayStart, dto.isHalfDayEnd);
        if (days <= 0)
            throw new envelope_1.BadRequestError('Leave duration must be at least half a day');
        if (type.maxConsecutiveDays && days > type.maxConsecutiveDays) {
            throw new envelope_1.BadRequestError(`${type.name} allows at most ${type.maxConsecutiveDays} consecutive days`);
        }
        const overlapping = await this.prisma.leaveApplication.findFirst({
            where: {
                employeeId: employee.id,
                status: { in: ['PENDING', 'APPROVED'] },
                AND: [
                    { fromDate: { lte: dayStart(dto.toDate) } },
                    { toDate: { gte: dayStart(dto.fromDate) } },
                ],
            },
        });
        if (overlapping)
            throw new envelope_1.BadRequestError(`Overlaps with ${overlapping.referenceNo} (${overlapping.status})`);
        const balanceYear = new Date().getFullYear();
        const balance = await this.prisma.leaveBalance.findUnique({
            where: { employeeId_leaveTypeId_year: { employeeId: employee.id, leaveTypeId: type.id, year: balanceYear } },
        });
        const available = balance ? balance.entitled + balance.carriedForward - balance.usedDays - balance.pendingDays : type.annualQuota;
        if (days > available) {
            throw new envelope_1.BadRequestError(`Insufficient balance: ${available} day(s) available for ${type.name}`);
        }
        const referenceNo = `LVN-${balanceYear}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
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
        });
        if (balance) {
            await this.prisma.leaveBalance.update({
                where: { id: balance.id },
                data: { pendingDays: { increment: days } },
            });
        }
        else {
            await this.prisma.leaveBalance.create({
                data: { employeeId: employee.id, leaveTypeId: type.id, year: balanceYear, entitled: type.annualQuota, pendingDays: days },
            });
        }
        const request = await this.engine.submit({
            docType: 'LEAVE_APPLICATION',
            docId: app.id,
            title: `${type.name} — ${days} day(s) from ${dto.fromDate}`,
            institutionId: user.institutionId,
            initiatedByUserId: user.userId,
            initiatorName: employee.fullName,
            contextDepartmentId: employee.departmentId,
        });
        await this.prisma.leaveApplication.update({ where: { id: app.id }, data: { approvalRequestId: request.id } });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'LEAVE_APPLIED', module: 'leave',
            entityType: 'LeaveApplication', entityId: app.id,
            summary: `${employee.fullName} applied for ${days} day(s) of ${type.name} (${referenceNo})`,
        });
        return { referenceNo, approvalRef: request.referenceNo, days, workflow: request.workflow.name };
    }
    async applications(user, filters, page = 1, pageSize = 25) {
        const scope = (0, scope_1.scopeFor)(user, 'leave:read_all', 'leave:read_dept', 'leave:read_self');
        const where = {};
        if (scope.kind === 'SELF' || filters.mine)
            where.employeeId = user.employeeId;
        else if (scope.kind === 'DEPT')
            where.employee = { departmentId: { in: scope.departmentIds } };
        if (filters.status)
            where.status = filters.status;
        if (filters.departmentId)
            where.employee = { ...where.employee, departmentId: filters.departmentId };
        if (filters.employeeCode)
            where.employee = { ...where.employee, employeeCode: filters.employeeCode };
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
        ]);
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
        };
    }
    async myApplication(refNo, user) {
        const app = await this.prisma.leaveApplication.findUnique({
            where: { referenceNo: refNo },
            include: {
                employee: { select: { id: true, employeeCode: true, fullName: true } },
                leaveType: true,
            },
        });
        if (!app)
            throw new envelope_1.NotFoundError('Application not found');
        const scope = (0, scope_1.scopeFor)(user, 'leave:read_all', 'leave:read_dept', 'leave:read_self');
        const employeeDept = await this.prisma.employee.findUnique({ where: { id: app.employeeId }, select: { departmentId: true } });
        if (app.employee.id !== user.employeeId && scope.kind === 'SELF')
            throw new envelope_1.ForbiddenError();
        if (scope.kind === 'DEPT' && employeeDept?.departmentId && !scope.departmentIds.includes(employeeDept.departmentId)) {
            throw new envelope_1.ForbiddenError('Outside your department scope');
        }
        return app;
    }
    async cancel(refNo, user) {
        const app = await this.prisma.leaveApplication.findUnique({ where: { referenceNo: refNo } });
        if (!app)
            throw new envelope_1.NotFoundError('Application not found');
        if (app.employeeId !== user.employeeId)
            throw new envelope_1.ForbiddenError('You can only cancel your own applications');
        if (app.status !== 'PENDING' && app.status !== 'APPROVED') {
            throw new envelope_1.BadRequestError(`Cannot cancel a ${app.status} application`);
        }
        if (app.status === 'APPROVED' && app.fromDate.getTime() < Date.now() - 24 * 3600 * 1000) {
            throw new envelope_1.BadRequestError('Approved leave already in effect — contact HR');
        }
        await this.prisma.leaveApplication.update({
            where: { id: app.id },
            data: { status: 'CANCELLED', decidedAt: new Date(), decisionNote: 'Cancelled by applicant' },
        });
        if (app.status === 'PENDING') {
            await this.prisma.leaveBalance.updateMany({
                where: { employeeId: app.employeeId, leaveTypeId: app.leaveTypeId, year: app.balanceYear },
                data: { pendingDays: { decrement: app.days } },
            });
        }
        else {
            await this.prisma.leaveBalance.updateMany({
                where: { employeeId: app.employeeId, leaveTypeId: app.leaveTypeId, year: app.balanceYear },
                data: { usedDays: { decrement: app.days } },
            });
        }
        if (app.approvalRequestId)
            await this.engine.cancel(app.approvalRequestId, user.name);
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'LEAVE_CANCELLED', module: 'leave',
            entityType: 'LeaveApplication', entityId: app.id, summary: `${refNo} cancelled by applicant`,
        });
        return { ok: true };
    }
    async updateReturned(refNo, dto, user) {
        const app = await this.prisma.leaveApplication.findUnique({ where: { referenceNo: refNo } });
        if (!app)
            throw new envelope_1.NotFoundError('Application not found');
        if (app.employeeId !== user.employeeId)
            throw new envelope_1.ForbiddenError('You can only edit your own applications');
        if (app.status !== 'RETURNED')
            throw new envelope_1.BadRequestError('Only returned applications can be edited');
        const days = daysBetween(dto.fromDate, dto.toDate, app.isHalfDayStart, app.isHalfDayEnd);
        if (days <= 0)
            throw new envelope_1.BadRequestError('Leave duration must be at least half a day');
        await this.prisma.leaveApplication.update({
            where: { id: app.id },
            data: {
                fromDate: dayStart(dto.fromDate),
                toDate: dayStart(dto.toDate),
                days,
                reason: dto.reason,
                contactDuringLeave: dto.contactDuringLeave ?? null,
            },
        });
        return { ok: true, days };
    }
    async calendar(user, month, year) {
        const scope = (0, scope_1.scopeFor)(user, 'leave:read_all', 'leave:read_dept', 'leave:read_self');
        const from = new Date(Date.UTC(year, month - 1, 1));
        const to = new Date(Date.UTC(year, month, 1));
        const where = {
            status: 'APPROVED',
            AND: [{ fromDate: { lt: to } }, { toDate: { gte: from } }],
        };
        if (scope.kind === 'SELF')
            where.employeeId = user.employeeId;
        else if (scope.kind === 'DEPT')
            where.employee = { departmentId: { in: scope.departmentIds } };
        const rows = await this.prisma.leaveApplication.findMany({
            where,
            include: { employee: { select: { employeeCode: true, fullName: true, department: { select: { name: true } } } }, leaveType: { select: { name: true, code: true } } },
        });
        const dayMap = {};
        for (const r of rows) {
            for (let d = new Date(r.fromDate); d <= r.toDate && d < to; d = new Date(d.getTime() + 24 * 3600 * 1000)) {
                const key = d.toISOString().slice(0, 10);
                (dayMap[key] ??= []).push({ code: r.employee.employeeCode, name: r.employee.fullName, type: r.leaveType.code });
            }
        }
        return { month, year, employees: rows.length, dayMap };
    }
    async applyLeaveOutcome(applicationId, outcome, note, attendance) {
        const app = await this.prisma.leaveApplication.findUnique({ where: { id: applicationId } });
        if (!app)
            return;
        await this.prisma.leaveApplication.update({
            where: { id: applicationId },
            data: { status: outcome, decidedAt: new Date(), decisionNote: note },
        });
        const balance = await this.prisma.leaveBalance.findUnique({
            where: { employeeId_leaveTypeId_year: { employeeId: app.employeeId, leaveTypeId: app.leaveTypeId, year: app.balanceYear } },
        });
        if (balance) {
            if (outcome === 'APPROVED') {
                await this.prisma.leaveBalance.update({
                    where: { id: balance.id },
                    data: { pendingDays: { decrement: app.days }, usedDays: { increment: app.days } },
                });
                await attendance.markLeaveAttendance(app.employeeId, app.fromDate.toISOString(), app.toDate.toISOString());
            }
            else {
                await this.prisma.leaveBalance.update({
                    where: { id: balance.id },
                    data: { pendingDays: { decrement: app.days } },
                });
            }
        }
    }
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, approval_engine_service_1.ApprovalEngine])
], LeaveService);
//# sourceMappingURL=leave.service.js.map