import { Injectable, forwardRef, Inject } from '@nestjs/common'
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../../core/audit/audit.service'
import { ApprovalEngine } from '../../core/approvals/approval-engine.service'
import { SessionUser } from '../../core/auth/auth.types'
import { LeaveService } from '../leave/leave.service'
import { AttendanceService } from '../attendance/attendance.service'
import { PayrollService } from '../payroll/payroll.service'
import { RecruitmentService } from '../recruitment/recruitment.service'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../core/http/envelope'

export class DecideDto {
  @IsIn(['APPROVE', 'REJECT', 'RETURN']) decision!: 'APPROVE' | 'REJECT' | 'RETURN'
  @IsOptional() @IsString() @MaxLength(400) comment?: string
}

export class ResubmitDto {
  @IsOptional() @IsString() @MinLength(3) note?: string
}

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private engine: ApprovalEngine,
    private audit: AuditService,
    @Inject(forwardRef(() => LeaveService)) private leave: LeaveService,
    @Inject(forwardRef(() => AttendanceService)) private attendance: AttendanceService,
    @Inject(forwardRef(() => PayrollService)) private payroll: PayrollService,
    @Inject(forwardRef(() => RecruitmentService)) private recruitment: RecruitmentService
  ) {}

  async pending(user: SessionUser) {
    const items = await this.engine.pendingFor(user)
    const enriched = await Promise.all(items.map(async ({ request, stage, approvalsSoFar }) => {
      const doc = await this.docPreview(request.docType, request.docId)
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
      }
    }))
    return enriched.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
  }

  private async docPreview(docType: string, docId: string) {
    if (docType === 'LEAVE_APPLICATION') {
      const a = await this.prisma.leaveApplication.findUnique({
        where: { id: docId },
        include: { leaveType: true, employee: { select: { employeeCode: true, fullName: true, department: { select: { name: true } } } } },
      })
      if (!a) return null
      return {
        employee: a.employee,
        leaveTypeName: a.leaveType.name,
        fromDate: a.fromDate,
        toDate: a.toDate,
        days: a.days,
        reason: a.reason,
        referenceNo: a.referenceNo,
      }
    }
    if (docType === 'ATTENDANCE_CORRECTION') {
      const c = await this.prisma.attendanceCorrection.findUnique({
        where: { id: docId },
        include: { employee: { select: { employeeCode: true, fullName: true, department: { select: { name: true } } } } },
      })
      if (!c) return null
      return {
        employee: c.employee,
        date: c.date,
        requestedIn: c.requestedIn,
        requestedOut: c.requestedOut,
        reason: c.reason,
        referenceNo: c.referenceNo,
      }
    }
    if (docType === 'PAYROLL_RUN') {
      const r = await this.prisma.payrollRun.findUnique({ where: { id: docId } })
      if (!r) return null
      return {
        runNo: r.runNo,
        periodMonth: r.periodMonth,
        periodYear: r.periodYear,
        employeeCount: r.employeeCount,
        totalGross: r.totalGross,
        totalNet: r.totalNet,
        totalDeductions: r.totalDeductions,
      }
    }
    if (docType === 'VACANCY_REQUISITION') {
      const v = await this.prisma.vacancy.findUnique({
        where: { id: docId },
        include: { department: true, designation: true },
      })
      if (!v) return null
      return {
        requisitionNo: v.requisitionNo,
        title: v.title,
        department: v.department?.name ?? null,
        designation: v.designation?.title ?? null,
        openings: v.openings,
        employmentType: v.employmentType,
        justification: v.justification,
      }
    }
    return null
  }

  async detail(requestId: string, user: SessionUser) {
    const request = await this.engine.load(requestId)
    const doc = await this.docPreview(request.docType, request.docId)
    const stage = request.workflow.stages.find((s) => s.seq === request.currentStageSeq)
    const actorIds = stage ? await this.engine.stageActorUserIds(stage, request.contextDepartmentId) : []
    const actorUsers = await this.prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, email: true, employee: { select: { fullName: true } } },
    })
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
    }
  }

  async decide(requestId: string, dto: DecideDto, user: SessionUser) {
    const result = await this.engine.decide(requestId, user, dto.decision, dto.comment)
    const outcome = result.outcome
    if (outcome !== 'AWAITING_CO_APPROVERS' && outcome !== 'ADVANCED') {
      await this.applyOutcome(result.request.docType, result.request.docId, outcome, dto.comment ?? null)
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
    })
    return { outcome, request: result.request }
  }

  async resubmit(requestId: string, dto: ResubmitDto, user: SessionUser) {
    const request = await this.engine.load(requestId)
    if (!request.initiatedByUserId || request.initiatedByUserId !== user.userId) {
      throw new ForbiddenError('Only the initiator can resubmit this request')
    }
    const updated = await this.engine.resubmit(requestId, user, dto.note)
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'APPROVAL_RESUBMITTED', module: 'approvals',
      entityType: updated.docType, entityId: updated.docId, summary: `${updated.referenceNo} resubmitted by ${user.name}`,
    })
    return { ok: true }
  }

  async history(user: SessionUser, mine: boolean) {
    const where = mine ? { initiatedByUserId: user.userId } : {}
    const rows = await this.prisma.approvalRequest.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      take: 100,
      include: { workflow: { select: { name: true } } },
    })
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
    }))
  }

  private async applyOutcome(docType: string, docId: string, outcome: 'APPROVED' | 'REJECTED' | 'RETURNED', note: string | null) {
    try {
      if (docType === 'LEAVE_APPLICATION') {
        await this.leave.applyLeaveOutcome(docId, outcome, note, this.attendance)
      } else if (docType === 'ATTENDANCE_CORRECTION') {
        await this.attendance.applyCorrectionOutcome(docId, outcome, note)
      } else if (docType === 'PAYROLL_RUN') {
        await this.payroll.applyRunOutcome(docId, outcome, note)
      } else if (docType === 'VACANCY_REQUISITION') {
        await this.recruitment.applyVacancyOutcome(docId, outcome, note)
      }
    } catch (err) {
      console.warn(`[approvals] outcome application warning: ${docType} ${docId} ${outcome}: ${(err as Error).message}`)
    }
  }
}
