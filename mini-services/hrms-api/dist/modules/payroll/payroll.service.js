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
exports.PayrollService = exports.AdjustPayslipDto = exports.CreateRunDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../core/audit/audit.service");
const approval_engine_service_1 = require("../../core/approvals/approval-engine.service");
const envelope_1 = require("../../core/http/envelope");
class CreateRunDto {
    month;
    year;
    remarks;
}
exports.CreateRunDto = CreateRunDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], CreateRunDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2020),
    (0, class_validator_1.Max)(2035),
    __metadata("design:type", Number)
], CreateRunDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRunDto.prototype, "remarks", void 0);
class AdjustPayslipDto {
    hold;
    arrearAmount;
    adjustmentNote;
}
exports.AdjustPayslipDto = AdjustPayslipDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdjustPayslipDto.prototype, "hold", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(2000000),
    __metadata("design:type", Number)
], AdjustPayslipDto.prototype, "arrearAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdjustPayslipDto.prototype, "adjustmentNote", void 0);
const DEFAULT_COMPONENTS = [
    { code: 'BASIC', name: 'Basic Pay', kind: 'EARNING', calcType: 'FIXED', value: 0 },
    { code: 'DA', name: 'Dearness Allowance', kind: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 42 },
    { code: 'HRA', name: 'House Rent Allowance', kind: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 20 },
    { code: 'CONVY', name: 'Conveyance Allowance', kind: 'EARNING', calcType: 'FIXED', value: 1600 },
    { code: 'MEDICAL', name: 'Medical Allowance', kind: 'EARNING', calcType: 'FIXED', value: 1250 },
    { code: 'SPECIAL', name: 'Special Allowance', kind: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 9 },
    { code: 'EPF_EE', name: 'EPF (Employee Share)', kind: 'DEDUCTION', calcType: 'FIXED', value: 0 },
    { code: 'TDS', name: 'Income Tax (TDS)', kind: 'DEDUCTION', calcType: 'FIXED', value: 0 },
    { code: 'PT', name: 'Professional Tax', kind: 'DEDUCTION', calcType: 'FIXED', value: 0 },
];
const EPF_RATE = 0.12;
const EPF_BASIC_CEILING = 15000;
const PT_THRESHOLD = 25000;
const PT_AMOUNT = 200;
function monthlyTds(grossMonthly) {
    const annual = grossMonthly * 12 - 50000;
    if (annual <= 300000)
        return 0;
    let tax = 0;
    const slabs = [[300000, 0], [700000, 0.05], [1000000, 0.1], [1200000, 0.15], [1500000, 0.2]];
    let prev = 300000;
    for (const [limit, rate] of slabs.slice(1)) {
        if (annual > limit)
            tax += (limit - prev) * rate;
        else {
            tax += (Math.max(annual - prev, 0)) * rate;
            break;
        }
        prev = limit;
    }
    if (annual > 1500000)
        tax += (annual - 1500000) * 0.3;
    return Math.round(tax / 12);
}
let PayrollService = class PayrollService {
    prisma;
    audit;
    engine;
    constructor(prisma, audit, engine) {
        this.prisma = prisma;
        this.audit = audit;
        this.engine = engine;
    }
    async structures(user) {
        const rows = await this.prisma.salaryStructure.findMany({
            include: {
                employee: { select: { employeeCode: true, fullName: true, designation: { select: { title: true } }, department: { select: { name: true } } } },
                components: true,
            },
            orderBy: { employee: { fullName: 'asc' } },
            take: 400,
        });
        return rows.map((s) => {
            const comps = new Map(s.components.map((c) => [c.code, c]));
            const gross = this.grossPreview(s.basicMonthly, s.daPercent, s.hraPercent, comps.get('CONVY')?.value ?? 1600, comps.get('MEDICAL')?.value ?? 1250, comps.get('SPECIAL')?.value ?? 9);
            return {
                employee: s.employee,
                effectiveFrom: s.effectiveFrom,
                basicMonthly: s.basicMonthly,
                daPercent: s.daPercent,
                hraPercent: s.hraPercent,
                grossPreview: gross,
                components: s.components.map((c) => ({ code: c.code, name: c.name, kind: c.kind, calcType: c.calcType, value: c.value })),
            };
        });
    }
    grossPreview(basic, da, hra, convy, medical, special) {
        return Math.round(basic + (basic * da) / 100 + (basic * hra) / 100 + convy + medical + (basic * special) / 100);
    }
    async myStructure(user) {
        const s = await this.prisma.salaryStructure.findUnique({
            where: { employeeId: user.employeeId },
            include: { components: true, employee: { select: { fullName: true, employeeCode: true } } },
        });
        if (!s)
            return null;
        const comps = new Map(s.components.map((c) => [c.code, c]));
        return {
            basicMonthly: s.basicMonthly,
            daPercent: s.daPercent,
            hraPercent: s.hraPercent,
            grossPreview: this.grossPreview(s.basicMonthly, s.daPercent, s.hraPercent, comps.get('CONVY')?.value ?? 1600, comps.get('MEDICAL')?.value ?? 1250, comps.get('SPECIAL')?.value ?? 9),
            components: s.components.map((c) => ({ code: c.code, name: c.name, kind: c.kind, calcType: c.calcType, value: c.value })),
            effectiveFrom: s.effectiveFrom,
        };
    }
    async runs(user) {
        const rows = await this.prisma.payrollRun.findMany({
            where: { institutionId: user.institutionId },
            orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
            take: 30,
            include: { processedBy: { select: { email: true, employee: { select: { fullName: true } } } } },
        });
        return rows.map((r) => ({
            id: r.id,
            runNo: r.runNo,
            periodMonth: r.periodMonth,
            periodYear: r.periodYear,
            status: r.status,
            employeeCount: r.employeeCount,
            totalGross: r.totalGross,
            totalDeductions: r.totalDeductions,
            totalNet: r.totalNet,
            processedBy: r.processedBy?.employee?.fullName ?? r.processedBy?.email ?? null,
            processedAt: r.processedAt,
            approvedAt: r.approvedAt,
            remarks: r.remarks,
            approvalRequestId: r.approvalRequestId,
        }));
    }
    async runDetail(runId, user) {
        const run = await this.prisma.payrollRun.findUnique({
            where: { id: runId },
            include: {
                payslips: {
                    include: { employee: { select: { employeeCode: true, fullName: true, department: { select: { name: true } }, designation: { select: { title: true } } } } },
                    orderBy: { employee: { fullName: 'asc' } },
                },
            },
        });
        if (!run || run.institutionId !== user.institutionId)
            throw new envelope_1.NotFoundError('Payroll run not found');
        const canSeeAll = user.permissions.includes('payroll:read_all');
        const slips = canSeeAll ? run.payslips : run.payslips.filter((p) => p.employeeId === user.employeeId);
        return {
            run: {
                id: run.id, runNo: run.runNo, periodMonth: run.periodMonth, periodYear: run.periodYear,
                status: run.status, employeeCount: run.employeeCount, totalGross: run.totalGross,
                totalDeductions: run.totalDeductions, totalNet: run.totalNet, remarks: run.remarks,
                processedAt: run.processedAt, approvedAt: run.approvedAt, approvalRequestId: run.approvalRequestId,
            },
            payslips: slips.map((p) => ({
                payslipNo: p.payslipNo,
                employee: p.employee,
                grossEarnings: p.grossEarnings,
                totalDeductions: p.totalDeductions,
                netPay: p.netPay,
                paidDays: p.paidDays,
                lopDays: p.lopDays,
                arrearAmount: p.arrearAmount,
                status: p.status,
            })),
        };
    }
    async createRun(dto, user) {
        const existing = await this.prisma.payrollRun.count({
            where: { institutionId: user.institutionId, periodYear: dto.year, periodMonth: dto.month },
        });
        const runNo = `PR-${dto.year}-${String(dto.month).padStart(2, '0')}${existing > 0 ? `-R${existing + 1}` : ''}`;
        const run = await this.prisma.payrollRun.create({
            data: {
                runNo,
                institutionId: user.institutionId,
                periodMonth: dto.month,
                periodYear: dto.year,
                status: 'DRAFT',
                remarks: dto.remarks ?? null,
            },
        });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'PAYROLL_RUN_CREATED', module: 'payroll',
            entityType: 'PayrollRun', entityId: run.id, summary: `Payroll run ${runNo} created`,
        });
        return { id: run.id, runNo: run.runNo, status: run.status };
    }
    async computeRun(runId, user) {
        const run = await this.prisma.payrollRun.findUnique({ where: { id: runId } });
        if (!run || run.institutionId !== user.institutionId)
            throw new envelope_1.NotFoundError('Payroll run not found');
        if (run.status !== 'DRAFT')
            throw new envelope_1.BadRequestError(`Run is ${run.status}; only DRAFT runs can be computed`);
        const employees = await this.prisma.employee.findMany({
            where: {
                institutionId: run.institutionId,
                status: { in: ['ACTIVE', 'PROBATION', 'ON_NOTICE', 'ON_LONG_LEAVE'] },
                salaryStructure: { isNot: null },
            },
            include: { salaryStructure: { include: { components: true } } },
        });
        if (employees.length === 0)
            throw new envelope_1.BadRequestError('No eligible employees with salary structures');
        const from = new Date(Date.UTC(run.periodYear, run.periodMonth - 1, 1));
        const to = new Date(Date.UTC(run.periodYear, run.periodMonth, 1));
        const attendance = await this.prisma.attendanceRecord.groupBy({
            by: ['employeeId', 'status'],
            where: { date: { gte: from, lt: to }, status: { in: ['PRESENT', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'WFH', 'OFFICIAL_DUTY'] } },
            _count: { _all: true },
        });
        const perEmp = new Map();
        for (const a of attendance) {
            const e = perEmp.get(a.employeeId) ?? {};
            e[a.status] = a._count._all;
            perEmp.set(a.employeeId, e);
        }
        let totalGross = 0, totalDed = 0, totalNet = 0, count = 0;
        await this.prisma.payslip.deleteMany({ where: { payrollRunId: run.id } });
        const monthKey = `${run.periodYear}-${String(run.periodMonth).padStart(2, '0')}`;
        for (const emp of employees) {
            const s = emp.salaryStructure;
            const comp = (code) => s.components.find((c) => c.code === code);
            const counts = perEmp.get(emp.id) ?? {};
            const working = (counts.PRESENT ?? 0) + (counts.HALF_DAY ?? 0) * 0.5 + (counts.ABSENT ?? 0) + (counts.ON_LEAVE ?? 0) + (counts.WFH ?? 0) + (counts.OFFICIAL_DUTY ?? 0);
            const lop = counts.ABSENT ?? 0;
            const paidDays = working > 0 ? Math.max(working - lop, 0.5) : 0;
            const factor = working > 0 ? paidDays / working : 1;
            const basic = s.basicMonthly;
            const daVal = comp('DA')?.value ?? s.daPercent;
            const hraVal = comp('HRA')?.value ?? s.hraPercent;
            const convy = comp('CONVY')?.value ?? 1600;
            const medical = comp('MEDICAL')?.value ?? 1250;
            const specialPct = comp('SPECIAL')?.value ?? 9;
            const gross = this.grossPreview(basic, daVal, hraVal, convy, medical, specialPct);
            const grossProRated = Math.round(gross * factor);
            const epf = Math.round(Math.min(basic, EPF_BASIC_CEILING) * EPF_RATE);
            const tds = monthlyTds(gross);
            const pt = gross >= PT_THRESHOLD ? PT_AMOUNT : 0;
            const deductions = epf + tds + pt;
            const net = Math.max(0, grossProRated - deductions);
            const lines = [
                { code: 'BASIC', name: 'Basic Pay', kind: 'EARNING', amount: Math.round(basic * factor), calc: `${factor === 1 ? 'full' : (factor * 100).toFixed(1) + '% of'} basic` },
                { code: 'DA', name: 'Dearness Allowance', kind: 'EARNING', amount: Math.round((basic * daVal) / 100 * factor), calc: `${daVal}% of basic` },
                { code: 'HRA', name: 'House Rent Allowance', kind: 'EARNING', amount: Math.round((basic * hraVal) / 100 * factor), calc: `${hraVal}% of basic` },
                { code: 'CONVY', name: 'Conveyance Allowance', kind: 'EARNING', amount: Math.round(convy * factor), calc: 'fixed' },
                { code: 'MEDICAL', name: 'Medical Allowance', kind: 'EARNING', amount: Math.round(medical * factor), calc: 'fixed' },
                { code: 'SPECIAL', name: 'Special Allowance', kind: 'EARNING', amount: Math.round((basic * specialPct) / 100 * factor), calc: `${specialPct}% of basic` },
                { code: 'EPF_EE', name: 'EPF (Employee Share)', kind: 'DEDUCTION', amount: epf, calc: `12% of basic (ceiling ₹15,000)` },
                { code: 'TDS', name: 'Income Tax (TDS)', kind: 'DEDUCTION', amount: tds, calc: 'demonstration slabs' },
                { code: 'PT', name: 'Professional Tax', kind: 'DEDUCTION', amount: pt, calc: gross >= PT_THRESHOLD ? '₹200 above ₹25,000 gross' : 'below threshold' },
            ];
            const payslipNo = `PS-${monthKey}-${emp.employeeCode.replace('EMP-', '')}`;
            await this.prisma.payslip.create({
                data: {
                    payslipNo,
                    payrollRunId: run.id,
                    employeeId: emp.id,
                    periodMonth: run.periodMonth,
                    periodYear: run.periodYear,
                    basic,
                    grossEarnings: grossProRated,
                    totalDeductions: deductions,
                    netPay: net,
                    paidDays,
                    lopDays: lop,
                    status: 'DRAFT',
                    lines: { create: lines.map((l) => ({ code: l.code, name: l.name, kind: l.kind, amount: l.amount, calcDetail: l.calc })) },
                },
            });
            totalGross += grossProRated;
            totalDed += deductions;
            totalNet += net;
            count++;
        }
        await this.prisma.payrollRun.update({
            where: { id: run.id },
            data: { employeeCount: count, totalGross, totalDeductions: totalDed, totalNet, processedByUserId: user.userId, processedAt: new Date() },
        });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'PAYROLL_COMPUTED', module: 'payroll',
            entityType: 'PayrollRun', entityId: run.id,
            summary: `Payroll ${run.runNo} computed — ${count} employees, net ₹${totalNet.toLocaleString('en-IN')}`,
        });
        return { employeeCount: count, totalGross, totalDeductions: totalDed, totalNet };
    }
    async submitRun(runId, user) {
        const run = await this.prisma.payrollRun.findUnique({ where: { id: runId } });
        if (!run)
            throw new envelope_1.NotFoundError('Payroll run not found');
        if (run.status !== 'DRAFT' || run.employeeCount === 0) {
            throw new envelope_1.BadRequestError('Compute the run before submitting it for approval');
        }
        const request = await this.engine.submit({
            docType: 'PAYROLL_RUN',
            docId: run.id,
            title: `Payroll ${run.periodMonth}/${run.periodYear} — ${run.employeeCount} employees`,
            institutionId: run.institutionId,
            initiatedByUserId: user.userId,
            initiatorName: user.name,
        });
        await this.prisma.payrollRun.update({
            where: { id: run.id },
            data: { status: 'PENDING_APPROVAL', approvalRequestId: request.id },
        });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'PAYROLL_SUBMITTED', module: 'payroll',
            entityType: 'PayrollRun', entityId: run.id, summary: `Payroll ${run.runNo} submitted for approval (${request.referenceNo})`,
        });
        return { approvalRef: request.referenceNo, status: 'PENDING_APPROVAL' };
    }
    async applyRunOutcome(runId, outcome, note) {
        const run = await this.prisma.payrollRun.findUnique({ where: { id: runId } });
        if (!run)
            return;
        if (outcome === 'APPROVED') {
            await this.prisma.payrollRun.update({ where: { id: runId }, data: { status: 'COMPLETED', approvedAt: new Date() } });
            const slips = await this.prisma.payslip.updateMany({ where: { payrollRunId: runId }, data: { status: 'RELEASED' } });
            const notified = await this.prisma.payslip.findMany({ where: { payrollRunId: runId }, select: { employeeId: true } });
            const users = await this.prisma.user.findMany({ where: { employeeId: { in: notified.map((n) => n.employeeId) } }, select: { id: true } });
            if (users.length) {
                await this.engine.notifyMany(users.map((u) => u.id), 'PAYSLIP_READY', `Payslip for ${run.periodMonth}/${run.periodYear} is ready`, `Net pay credited view available. Run ${run.runNo} approved${note ? ` — ${note}` : ''}.`, '#/payroll', 'SUCCESS');
            }
            await this.audit.record({
                actorEmail: 'system', action: 'PAYROLL_COMPLETED', module: 'payroll',
                entityType: 'PayrollRun', entityId: runId,
                summary: `Payroll ${run.runNo} completed — ${slips.count} payslips released`,
            });
        }
        else {
            await this.prisma.payrollRun.update({
                where: { id: runId },
                data: { status: 'DRAFT', remarks: note ?? `Returned: ${outcome}` },
            });
        }
    }
    async disburse(runId, user) {
        const run = await this.prisma.payrollRun.findUnique({ where: { id: runId } });
        if (!run)
            throw new envelope_1.NotFoundError('Payroll run not found');
        if (run.status !== 'COMPLETED')
            throw new envelope_1.BadRequestError('Only completed runs can be marked disbursed');
        await this.prisma.payslip.updateMany({ where: { payrollRunId: runId, status: 'RELEASED' }, data: { status: 'PAID', paidOn: new Date() } });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'PAYROLL_DISBURSED', module: 'payroll',
            entityType: 'PayrollRun', entityId: runId, summary: `Payroll ${run.runNo} marked disbursed`,
        });
        return { ok: true };
    }
    async payslip(payslipNo, user) {
        const slip = await this.prisma.payslip.findUnique({
            where: { payslipNo },
            include: {
                lines: true,
                employee: { select: { employeeCode: true, fullName: true, designation: { select: { title: true } }, department: { select: { name: true } } } },
                payrollRun: { select: { runNo: true, status: true, approvedAt: true } },
            },
        });
        if (!slip)
            throw new envelope_1.NotFoundError('Payslip not found');
        const isOwn = slip.employeeId === user.employeeId;
        const canReadAll = user.permissions.includes('payroll:read_all');
        if (!isOwn && !canReadAll)
            throw new envelope_1.ForbiddenError('Payslips are confidential');
        if (isOwn && !canReadAll && slip.status === 'DRAFT') {
            throw new envelope_1.ForbiddenError('Payslip is not released yet');
        }
        return {
            payslipNo: slip.payslipNo,
            periodMonth: slip.periodMonth,
            periodYear: slip.periodYear,
            status: slip.status,
            employee: slip.employee,
            basic: slip.basic,
            grossEarnings: slip.grossEarnings,
            totalDeductions: slip.totalDeductions,
            netPay: slip.netPay,
            paidDays: slip.paidDays,
            lopDays: slip.lopDays,
            arrearAmount: slip.arrearAmount,
            adjustmentNote: slip.adjustmentNote,
            lines: slip.lines.map((l) => ({ code: l.code, name: l.name, kind: l.kind, amount: l.amount, calcDetail: l.calcDetail })),
            run: slip.payrollRun,
        };
    }
    async myPayslips(user) {
        const rows = await this.prisma.payslip.findMany({
            where: { employeeId: user.employeeId, status: { in: ['RELEASED', 'PAID', 'ON_HOLD'] } },
            orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
            take: 18,
        });
        return rows.map((p) => ({
            payslipNo: p.payslipNo,
            periodMonth: p.periodMonth,
            periodYear: p.periodYear,
            grossEarnings: p.grossEarnings,
            totalDeductions: p.totalDeductions,
            netPay: p.netPay,
            status: p.status,
            paidOn: p.paidOn,
        }));
    }
    async adjustPayslip(payslipNo, dto, user) {
        const slip = await this.prisma.payslip.findUnique({
            where: { payslipNo },
            include: { lines: true },
        });
        if (!slip)
            throw new envelope_1.NotFoundError('Payslip not found');
        if (slip.status === 'PAID')
            throw new envelope_1.BadRequestError('Already disbursed');
        const data = {};
        if (dto.hold !== undefined)
            data.status = dto.hold ? 'ON_HOLD' : 'RELEASED';
        if (dto.arrearAmount !== undefined) {
            data.arrearAmount = dto.arrearAmount;
            data.netPay = slip.netPay - slip.arrearAmount + dto.arrearAmount;
            const existingLine = slip.lines.find((l) => l.code === 'ARREAR');
            if (dto.arrearAmount !== 0 && !existingLine) {
                await this.prisma.payslipLine.create({
                    data: { payslipId: slip.id, code: 'ARREAR', name: 'Arrear / Adjustment', kind: 'EARNING', amount: dto.arrearAmount, calcDetail: dto.adjustmentNote ?? 'manual adjustment' },
                });
            }
            else if (existingLine && dto.arrearAmount !== 0) {
                await this.prisma.payslipLine.update({
                    where: { id: existingLine.id },
                    data: { amount: dto.arrearAmount, calcDetail: dto.adjustmentNote ?? 'manual adjustment' },
                });
            }
        }
        if (dto.adjustmentNote !== undefined)
            data.adjustmentNote = dto.adjustmentNote;
        await this.prisma.payslip.update({ where: { id: slip.id }, data });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'PAYSLIP_ADJUSTED', module: 'payroll',
            entityType: 'Payslip', entityId: slip.id,
            summary: `Payslip ${payslipNo} adjusted${dto.hold !== undefined ? (dto.hold ? ' — placed on hold' : ' — released') : ''}${dto.arrearAmount !== undefined ? `, arrear ₹${dto.arrearAmount.toLocaleString('en-IN')}` : ''}`,
        });
        return { ok: true };
    }
    async costTrend(user) {
        const rows = await this.prisma.payrollRun.findMany({
            where: { institutionId: user.institutionId, status: { in: ['COMPLETED', 'PENDING_APPROVAL'] } },
            orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
            take: 18,
            select: { periodMonth: true, periodYear: true, totalGross: true, totalNet: true, totalDeductions: true, employeeCount: true },
        });
        return rows;
    }
    async payrollByDepartment(runId) {
        const slips = await this.prisma.payslip.findMany({
            where: { payrollRunId: runId },
            include: { employee: { select: { department: { select: { name: true } } } } },
        });
        const byDept = new Map();
        for (const s of slips) {
            const key = s.employee.department?.name ?? '—';
            const agg = byDept.get(key) ?? { department: key, gross: 0, net: 0, count: 0 };
            agg.gross += s.grossEarnings;
            agg.net += s.netPay;
            agg.count++;
            byDept.set(key, agg);
        }
        return [...byDept.values()].sort((a, b) => b.gross - a.gross);
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, approval_engine_service_1.ApprovalEngine])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map