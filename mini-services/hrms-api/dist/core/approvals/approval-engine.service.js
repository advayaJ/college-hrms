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
exports.ApprovalEngine = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const envelope_1 = require("../http/envelope");
const DOC_LABEL = {
    LEAVE_APPLICATION: 'Leave application',
    ATTENDANCE_CORRECTION: 'Attendance correction',
    PAYROLL_RUN: 'Payroll run',
    VACANCY_REQUISITION: 'Vacancy requisition',
};
const DOC_LINK = {
    LEAVE_APPLICATION: '#/leave',
    ATTENDANCE_CORRECTION: '#/attendance',
    PAYROLL_RUN: '#/payroll',
    VACANCY_REQUISITION: '#/recruitment',
};
function refNo() {
    const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `APR-${new Date().getFullYear()}-${rnd}`;
}
let ApprovalEngine = class ApprovalEngine {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async submit(input) {
        const workflow = await this.prisma.approvalWorkflow.findFirst({
            where: { institutionId: input.institutionId, docType: input.docType, isActive: true },
            include: { stages: true },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        });
        if (!workflow || workflow.stages.length === 0) {
            throw new envelope_1.BadRequestError(`No active approval workflow configured for ${input.docType}`);
        }
        const request = await this.prisma.approvalRequest.create({
            data: {
                referenceNo: refNo(),
                workflowId: workflow.id,
                docType: input.docType,
                docId: input.docId,
                title: input.title,
                initiatedByUserId: input.initiatedByUserId ?? null,
                initiatorName: input.initiatorName,
                contextDepartmentId: input.contextDepartmentId ?? null,
                currentStageSeq: 1,
                status: 'PENDING',
                actions: {
                    create: {
                        stageSeq: 1,
                        actorUserId: input.initiatedByUserId ?? null,
                        actorName: input.initiatorName,
                        action: 'SUBMITTED',
                        comment: 'Submitted for approval',
                    },
                },
            },
        });
        await this.notifyStageActors(request.id, 1);
        return this.load(request.id);
    }
    async decide(requestId, actor, decision, comment) {
        const request = await this.load(requestId);
        if (request.status !== 'PENDING') {
            throw new envelope_1.ConflictError(`Request is already ${request.status}`);
        }
        const stage = this.stageAt(request, request.currentStageSeq);
        if (!stage)
            throw new envelope_1.ConflictError('Workflow has no stage for the current position');
        const isActor = await this.userIsStageActor(actor, stage, request.contextDepartmentId);
        if (!isActor)
            throw new envelope_1.ForbiddenError('You are not an approver for this stage');
        const already = await this.prisma.approvalAction.findFirst({
            where: { requestId, stageSeq: request.currentStageSeq, actorUserId: actor.userId, action: { in: ['APPROVED', 'REJECTED', 'RETURNED'] } },
        });
        if (already)
            throw new envelope_1.ConflictError('You have already acted on this stage');
        const actionType = decision === 'APPROVE' ? 'APPROVED' : decision === 'REJECT' ? 'REJECTED' : 'RETURNED';
        if (decision === 'REJECT' || decision === 'RETURN') {
            await this.prisma.approvalRequest.update({
                where: { id: requestId },
                data: {
                    status: decision === 'REJECT' ? 'REJECTED' : 'RETURNED',
                    decidedAt: new Date(),
                    actions: {
                        create: {
                            stageSeq: request.currentStageSeq,
                            actorUserId: actor.userId,
                            actorName: actor.name,
                            actorRoleKey: actor.activeRoleKey,
                            action: actionType,
                            comment: comment ?? null,
                        },
                    },
                },
            });
            await this.notifyInitiator(requestId, decision === 'REJECT' ? 'rejected' : 'returned for correction', comment);
            return { request: await this.load(requestId), outcome: decision === 'REJECT' ? 'REJECTED' : 'RETURNED' };
        }
        await this.prisma.approvalAction.create({
            data: {
                requestId,
                stageSeq: request.currentStageSeq,
                actorUserId: actor.userId,
                actorName: actor.name,
                actorRoleKey: actor.activeRoleKey,
                action: 'APPROVED',
                comment: comment ?? null,
            },
        });
        const actorIds = await this.stageActorUserIds(stage, request.contextDepartmentId);
        const approvals = await this.prisma.approvalAction.findMany({
            where: { requestId, stageSeq: request.currentStageSeq, action: 'APPROVED' },
            select: { actorUserId: true },
        });
        const distinct = new Set(approvals.map((a) => a.actorUserId));
        const required = stage.strategy === 'ALL'
            ? actorIds.length
            : stage.strategy === 'QUORUM'
                ? Math.min(stage.minApprovals, Math.max(actorIds.length, 1))
                : 1;
        if (distinct.size < required) {
            return { request: await this.load(requestId), outcome: 'AWAITING_CO_APPROVERS' };
        }
        const maxSeq = Math.max(...request.workflow.stages.map((s) => s.seq));
        const isFinal = request.currentStageSeq >= maxSeq || stage.isFinal;
        if (isFinal) {
            await this.prisma.approvalRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED', decidedAt: new Date() },
            });
            await this.notifyInitiator(requestId, 'approved', comment);
            return { request: await this.load(requestId), outcome: 'APPROVED' };
        }
        const nextSeq = request.currentStageSeq + 1;
        await this.prisma.approvalRequest.update({ where: { id: requestId }, data: { currentStageSeq: nextSeq } });
        await this.notifyStageActors(requestId, nextSeq);
        return { request: await this.load(requestId), outcome: 'ADVANCED' };
    }
    async resubmit(requestId, actor, note) {
        const request = await this.load(requestId);
        if (request.status !== 'RETURNED')
            throw new envelope_1.ConflictError('Only returned requests can be resubmitted');
        await this.prisma.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: 'PENDING',
                currentStageSeq: 1,
                decidedAt: null,
                actions: {
                    create: {
                        stageSeq: 1,
                        actorUserId: actor.userId,
                        actorName: actor.name,
                        action: 'RESUBMITTED',
                        comment: note ?? 'Resubmitted after correction',
                    },
                },
            },
        });
        await this.notifyStageActors(requestId, 1);
        return this.load(requestId);
    }
    async cancel(requestId, actorName) {
        const request = await this.prisma.approvalRequest.findUnique({ where: { id: requestId } });
        if (!request)
            return null;
        if (request.status === 'PENDING' || request.status === 'RETURNED') {
            await this.prisma.approvalRequest.update({
                where: { id: requestId },
                data: {
                    status: 'CANCELLED',
                    decidedAt: new Date(),
                    actions: { create: { stageSeq: request.currentStageSeq, actorName, action: 'CANCELLED' } },
                },
            });
            await this.notifyInitiator(requestId, 'cancelled', undefined);
        }
        return request;
    }
    async pendingFor(user) {
        const requests = await this.prisma.approvalRequest.findMany({
            where: { status: 'PENDING' },
            orderBy: { submittedAt: 'desc' },
            take: 400,
        });
        const full = [];
        for (const base of requests) {
            const request = await this.load(base.id);
            const stage = this.stageAt(request, request.currentStageSeq);
            if (!stage)
                continue;
            const isActor = await this.userIsStageActor(user, stage, request.contextDepartmentId);
            if (!isActor)
                continue;
            const approvals = await this.prisma.approvalAction.findMany({
                where: { requestId: request.id, stageSeq: stage.seq, action: 'APPROVED' },
                select: { actorUserId: true },
            });
            full.push({ request, stage, approvalsSoFar: approvals.length });
        }
        return full;
    }
    async load(id) {
        const request = await this.prisma.approvalRequest.findUnique({
            where: { id },
            include: {
                workflow: { include: { stages: { orderBy: { seq: 'asc' } } } },
                actions: { orderBy: { actedAt: 'asc' } },
            },
        });
        if (!request)
            throw new envelope_1.NotFoundError('Approval request not found');
        return request;
    }
    stageAt(request, seq) {
        return request.workflow.stages.find((s) => s.seq === seq);
    }
    async userIsStageActor(user, stage, contextDepartmentId) {
        if (stage.approverType === 'USER')
            return stage.approverUserId === user.userId;
        if (!stage.approverRoleId)
            return false;
        const userRoles = await this.prisma.userRole.findMany({
            where: { userId: user.userId, roleId: stage.approverRoleId },
            include: { role: true },
        });
        if (userRoles.length === 0)
            return false;
        const role = userRoles[0].role;
        if (role.scope === 'DEPARTMENT') {
            if (!contextDepartmentId)
                return true;
            return userRoles.some((ur) => ur.departmentId === contextDepartmentId);
        }
        return true;
    }
    async stageActorUserIds(stage, contextDepartmentId) {
        if (stage.approverType === 'USER') {
            return stage.approverUserId ? [stage.approverUserId] : [];
        }
        if (!stage.approverRoleId)
            return [];
        const role = await this.prisma.role.findUnique({ where: { id: stage.approverRoleId } });
        const where = { roleId: stage.approverRoleId };
        if (role?.scope === 'DEPARTMENT' && contextDepartmentId) {
            where.departmentId = contextDepartmentId;
        }
        const userRoles = await this.prisma.userRole.findMany({ where, select: { userId: true } });
        return userRoles.map((u) => u.userId);
    }
    async notifyStageActors(requestId, seq) {
        const request = await this.load(requestId);
        const stage = this.stageAt(request, seq);
        if (!stage)
            return;
        const userIds = await this.stageActorUserIds(stage, request.contextDepartmentId);
        if (userIds.length === 0)
            return;
        await this.notifyMany(userIds, 'APPROVAL_PENDING', `${this.docLabel(request.docType)} awaiting your approval`, `${request.initiatorName || 'An employee'} — ${request.title}. Stage: ${stage.name}.`, '#/approvals', 'WARNING');
    }
    async notifyInitiator(requestId, verb, comment) {
        const request = await this.prisma.approvalRequest.findUnique({ where: { id: requestId } });
        if (!request?.initiatedByUserId)
            return;
        await this.notifyMany([request.initiatedByUserId], 'APPROVAL_DECISION', `Request ${request.referenceNo} was ${verb}`, `${this.docLabel(request.docType)} — ${request.title}${comment ? `. Comment: ${comment}` : ''}`, this.docLink(request.docType), verb === 'approved' ? 'SUCCESS' : verb === 'rejected' ? 'CRITICAL' : 'WARNING');
    }
    docLabel(docType) {
        return DOC_LABEL[docType] ?? 'Request';
    }
    docLink(docType) {
        return DOC_LINK[docType] ?? '#/dashboard';
    }
    async notifyMany(userIds, kind, title, body, link, severity = 'INFO') {
        if (userIds.length === 0)
            return;
        await this.prisma.notification.createMany({
            data: userIds.map((userId) => ({ userId, kind, title, body, link: link ?? null, severity })),
        });
    }
};
exports.ApprovalEngine = ApprovalEngine;
exports.ApprovalEngine = ApprovalEngine = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApprovalEngine);
//# sourceMappingURL=approval-engine.service.js.map