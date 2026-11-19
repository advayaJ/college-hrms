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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsService = exports.ResubmitDto = exports.DecideDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../core/audit/audit.service");
const approval_engine_service_1 = require("../../core/approvals/approval-engine.service");
const leave_service_1 = require("../leave/leave.service");
const attendance_service_1 = require("../attendance/attendance.service");
const payroll_service_1 = require("../payroll/payroll.service");
const recruitment_service_1 = require("../recruitment/recruitment.service");
const envelope_1 = require("../../core/http/envelope");
class DecideDto {
    decision;
    comment;
}
exports.DecideDto = DecideDto;
__decorate([
    (0, class_validator_1.IsIn)(['APPROVE', 'REJECT', 'RETURN']),
    __metadata("design:type", String)
], DecideDto.prototype, "decision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(400),
    __metadata("design:type", String)
], DecideDto.prototype, "comment", void 0);
class ResubmitDto {
    note;
}
exports.ResubmitDto = ResubmitDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], ResubmitDto.prototype, "note", void 0);
let ApprovalsService = class ApprovalsService {
    prisma;
    engine;
    audit;
    leave;
    attendance;
    payroll;
    recruitment;
    constructor(prisma, engine, audit, leave, attendance, payroll, recruitment) {
        this.prisma = prisma;
        this.engine = engine;
        this.audit = audit;
        this.leave = leave;
        this.attendance = attendance;
        this.payroll = payroll;
        this.recruitment = recruitment;
    }
    async pending(user) {
        const items = await this.engine.pendingFor(user);
        const enriched = await Promise.all(items.map(async ({ request, stage, approvalsSoFar }) => {
            const doc = await this.docPreview(request.docType, request.docId);
            return {
                id: request.id,
                referenceNo: request.referenceNo,
                docType: request.docType,
                title: request.title,
                initiatorName: request.initiatorName,
                submittedAt: request.submittedAt,
                currentStageSeq: request.currentStageSeq,
                workflowName: request.workflow.name,
                stage: {
                    seq: stage.seq,
                    name: stage.name,
                    strategy: stage.strategy,
                    minApprovals: stage.minApprovals,
                    approvalsSoFar,
                },
                doc,
            };
        }));
        return enriched.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    }
    async docPreview(docType, docId) {
        if (docType === 'LEAVE_APPLICATION') {
            const a = await this.prisma.leaveApplication.findUnique({
                where: { id: docId },
                include: { leaveType: true, employee: { select: { employeeCode: true, fullName: true, department: { select: { name: true } } } } },
            });
            if (!a)
                return null;
            return {
                employee: a.employee,
                leaveTypeName: a.leaveType.name,
                fromDate: a.fromDate,
                toDate: a.toDate,
                days: a.days,
                reason: a.reason,
                referenceNo: a.referenceNo,
            };
        }
        if (docType === 'ATTENDANCE_CORRECTION') {
            const c = await this.prisma.attendanceCorrection.findUnique({
                where: { id: docId },
                include: { employee: { select: { employeeCode: true, fullName: true, department: { select: { name: true } } } } },
            });
            if (!c)
                return null;
            return {
                employee: c.employee,
                date: c.date,
                requestedIn: c.requestedIn,
                requestedOut: c.requestedOut,
                reason: c.reason,
                referenceNo: c.referenceNo,
            };
        }
        if (docType === 'PAYROLL_RUN') {
            const r = await this.prisma.payrollRun.findUnique({ where: { id: docId } });
            if (!r)
                return null;
            return {
                runNo: r.runNo,
                periodMonth: r.periodMonth,
                periodYear: r.periodYear,
                employeeCount: r.employeeCount,
                totalGross: r.totalGross,
                totalNet: r.totalNet,
                totalDeductions: r.totalDeductions,
            };
        }
        if (docType === 'VACANCY_REQUISITION') {
            const v = await this.prisma.vacancy.findUnique({
                where: { id: docId },
                include: { department: true, designation: true },
            });
            if (!v)
                return null;
            return {
                requisitionNo: v.requisitionNo,
                title: v.title,
                department: v.department?.name ?? null,
                designation: v.designation?.title ?? null,
                openings: v.openings,
                employmentType: v.employmentType,
                justification: v.justification,
            };
        }
        return null;
    }
    async detail(requestId, user) {
        const request = await this.engine.load(requestId);
        const doc = await this.docPreview(request.docType, request.docId);
        const stage = request.workflow.stages.find((s) => s.seq === request.currentStageSeq);
        const actorIds = stage ? await this.engine.stageActorUserIds(stage, request.contextDepartmentId) : [];
        const actorUsers = await this.prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, email: true, employee: { select: { fullName: true } } },
        });
        return {
            request: {
                id: request.id,
                referenceNo: request.referenceNo,
                docType: request.docType,
                docId: request.docId,
                title: request.title,
                initiatorName: request.initiatorName,
                status: request.status,
                currentStageSeq: request.currentStageSeq,
                submittedAt: request.submittedAt,
                decidedAt: request.decidedAt,
            },
            workflow: {
                name: request.workflow.name,
                stages: request.workflow.stages.map((s) => ({
                    seq: s.seq,
                    name: s.name,
                    strategy: s.strategy,
                    minApprovals: s.minApprovals,
                    approverType: s.approverType,
                    slaHours: s.slaHours,
                    isFinal: s.isFinal,
                })),
            },
            currentStage: stage
                ? {
                    ...stage,
                    actors: actorUsers.map((a) => ({ id: a.id, name: a.employee?.fullName ?? a.email, email: a.email })),
                }
                : null,
            timeline: request.actions.map((a) => ({
                stageSeq: a.stageSeq,
                actorName: a.actorName,
                actorRoleKey: a.actorRoleKey,
                action: a.action,
                comment: a.comment,
                actedAt: a.actedAt,
            })),
            doc,
        };
    }
    async decide(requestId, dto, user) {
        const result = await this.engine.decide(requestId, user, dto.decision, dto.comment);
        const outcome = result.outcome;
        if (outcome !== 'AWAITING_CO_APPROVERS' && outcome !== 'ADVANCED') {
            await this.applyOutcome(result.request.docType, result.request.docId, outcome, dto.comment ?? null);
        }
        await this.audit.record({
            userId: user.userId,
            actorEmail: user.email,
            action: `APPROVAL_${outcome}`,
            module: 'approvals',
            entityType: result.request.docType,
            entityId: result.request.docId,
            summary: `${result.request.referenceNo} — ${outcome.toLowerCase().replace(/_/g, ' ')} by ${user.name}`,
            detail: { comment: dto.comment, stage: result.request.currentStageSeq },
        });
        return { outcome, request: result.request };
    }
    async resubmit(requestId, dto, user) {
        const request = await this.engine.load(requestId);
        if (!request.initiatedByUserId || request.initiatedByUserId !== user.userId) {
            throw new envelope_1.ForbiddenError('Only the initiator can resubmit this request');
        }
        const updated = await this.engine.resubmit(requestId, user, dto.note);
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'APPROVAL_RESUBMITTED', module: 'approvals',
            entityType: updated.docType, entityId: updated.docId, summary: `${updated.referenceNo} resubmitted by ${user.name}`,
        });
        return { ok: true };
    }
    async history(user, mine) {
        const where = mine ? { initiatedByUserId: user.userId } : {};
        const rows = await this.prisma.approvalRequest.findMany({
            where,
            orderBy: { submittedAt: 'desc' },
            take: 100,
            include: { workflow: { select: { name: true } } },
        });
        return rows.map((r) => ({
            id: r.id,
            referenceNo: r.referenceNo,
            docType: r.docType,
            title: r.title,
            initiatorName: r.initiatorName,
            workflowName: r.workflow.name,
            status: r.status,
            currentStageSeq: r.currentStageSeq,
            submittedAt: r.submittedAt,
            decidedAt: r.decidedAt,
        }));
    }
    async applyOutcome(docType, docId, outcome, note) {
        try {
            if (docType === 'LEAVE_APPLICATION') {
                await this.leave.applyLeaveOutcome(docId, outcome, note, this.attendance);
            }
            else if (docType === 'ATTENDANCE_CORRECTION') {
                await this.attendance.applyCorrectionOutcome(docId, outcome, note);
            }
            else if (docType === 'PAYROLL_RUN') {
                await this.payroll.applyRunOutcome(docId, outcome, note);
            }
            else if (docType === 'VACANCY_REQUISITION') {
                await this.recruitment.applyVacancyOutcome(docId, outcome, note);
            }
        }
        catch (err) {
            console.warn(`[approvals] outcome application warning: ${docType} ${docId} ${outcome}: ${err.message}`);
        }
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => leave_service_1.LeaveService))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => attendance_service_1.AttendanceService))),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => payroll_service_1.PayrollService))),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => recruitment_service_1.RecruitmentService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approval_engine_service_1.ApprovalEngine,
        audit_service_1.AuditService,
        leave_service_1.LeaveService,
        attendance_service_1.AttendanceService,
        payroll_service_1.PayrollService,
        recruitment_service_1.RecruitmentService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map