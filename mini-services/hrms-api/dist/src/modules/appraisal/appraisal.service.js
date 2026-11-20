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
exports.AppraisalService = exports.CreateGoalDto = exports.ReviewerReviewDto = exports.SelfAssessmentDto = exports.GoalProgressDto = exports.CreateCycleDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../core/audit/audit.service");
const approval_engine_service_1 = require("../../core/approvals/approval-engine.service");
const scope_1 = require("../../core/scope");
const envelope_1 = require("../../core/http/envelope");
class CreateCycleDto {
    name;
    periodFrom;
    periodTo;
    dueDate;
}
exports.CreateCycleDto = CreateCycleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], CreateCycleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCycleDto.prototype, "periodFrom", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCycleDto.prototype, "periodTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCycleDto.prototype, "dueDate", void 0);
class GoalProgressDto {
    completionPercent;
    evidenceNote;
}
exports.GoalProgressDto = GoalProgressDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GoalProgressDto.prototype, "completionPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GoalProgressDto.prototype, "evidenceNote", void 0);
class SelfAssessmentDto {
    selfAssessmentScore;
    selfComments;
}
exports.SelfAssessmentDto = SelfAssessmentDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SelfAssessmentDto.prototype, "selfAssessmentScore", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(30),
    __metadata("design:type", String)
], SelfAssessmentDto.prototype, "selfComments", void 0);
class ReviewerReviewDto {
    reviewerScore;
    reviewerComments;
    strengths;
    improvements;
    recommendation;
}
exports.ReviewerReviewDto = ReviewerReviewDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ReviewerReviewDto.prototype, "reviewerScore", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(30),
    __metadata("design:type", String)
], ReviewerReviewDto.prototype, "reviewerComments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewerReviewDto.prototype, "strengths", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewerReviewDto.prototype, "improvements", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['NONE', 'PROMOTION', 'SALARY_REVISION', 'TRAINING']),
    __metadata("design:type", String)
], ReviewerReviewDto.prototype, "recommendation", void 0);
class CreateGoalDto {
    employeeCode;
    title;
    description;
    category;
    weightPercent;
}
exports.CreateGoalDto = CreateGoalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "employeeCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['TEACHING', 'RESEARCH', 'ADMIN', 'DEVELOPMENT', 'MENTORING', 'OTHER']),
    __metadata("design:type", String)
], CreateGoalDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], CreateGoalDto.prototype, "weightPercent", void 0);
let AppraisalService = class AppraisalService {
    prisma;
    audit;
    engine;
    constructor(prisma, audit, engine) {
        this.prisma = prisma;
        this.audit = audit;
        this.engine = engine;
    }
    async cycles(user) {
        const rows = await this.prisma.appraisalCycle.findMany({
            where: { institutionId: user.institutionId },
            orderBy: { periodFrom: 'desc' },
            take: 10,
            include: { _count: { select: { reviews: true, goals: true } } },
        });
        return rows.map((c) => ({ id: c.id, name: c.name, periodFrom: c.periodFrom, periodTo: c.periodTo, status: c.status, dueDate: c.dueDate, reviewCount: c._count.reviews, goalCount: c._count.goals }));
    }
    async createCycle(dto, user) {
        const dup = await this.prisma.appraisalCycle.findUnique({ where: { name: dto.name } });
        if (dup)
            throw new envelope_1.BadRequestError('Cycle name already exists');
        const cycle = await this.prisma.appraisalCycle.create({
            data: {
                institutionId: user.institutionId,
                name: dto.name,
                periodFrom: new Date(dto.periodFrom),
                periodTo: new Date(dto.periodTo),
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                status: 'PLANNING',
            },
        });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'APPRAISAL_CYCLE_CREATED', module: 'appraisal',
            entityType: 'AppraisalCycle', entityId: cycle.id, summary: `Cycle ${dto.name} created`,
        });
        return { id: cycle.id };
    }
    async activateCycle(cycleId, user) {
        const cycle = await this.prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
        if (!cycle)
            throw new envelope_1.NotFoundError('Cycle not found');
        await this.prisma.appraisalCycle.updateMany({
            where: { institutionId: user.institutionId, status: { in: ['PLANNING', 'ACTIVE', 'REVIEW_UNDERWAY'] } },
            data: { status: 'ARCHIVED' },
        });
        await this.prisma.appraisalCycle.update({ where: { id: cycleId }, data: { status: 'ACTIVE' } });
        const employees = await this.prisma.employee.findMany({
            where: { institutionId: user.institutionId, status: { in: ['ACTIVE', 'PROBATION', 'ON_NOTICE'] } },
            select: { id: true, departmentId: true },
        });
        const existing = await this.prisma.performanceReview.findMany({ where: { cycleId }, select: { employeeId: true } });
        const have = new Set(existing.map((e) => e.employeeId));
        const toCreate = employees.filter((e) => !have.has(e.id));
        if (toCreate.length) {
            await this.prisma.performanceReview.createMany({
                data: toCreate.map((e) => ({ cycleId, employeeId: e.id, status: 'PENDING' })),
            });
        }
        return { reviews: toCreate.length };
    }
    async selfView(user) {
        const cycle = await this.prisma.appraisalCycle.findFirst({
            where: { institutionId: user.institutionId, status: { in: ['ACTIVE', 'REVIEW_UNDERWAY'] } },
            orderBy: { periodFrom: 'desc' },
        });
        if (!cycle)
            return { cycle: null };
        const [goals, review] = await Promise.all([
            this.prisma.goal.findMany({ where: { cycleId: cycle.id, employeeId: user.employeeId }, orderBy: { createdAt: 'asc' } }),
            this.prisma.performanceReview.findUnique({ where: { cycleId_employeeId: { cycleId: cycle.id, employeeId: user.employeeId } } }),
        ]);
        const history = await this.prisma.performanceReview.findMany({
            where: { employeeId: user.employeeId },
            orderBy: { completedAt: 'desc' },
            take: 4,
            include: { cycle: { select: { name: true } } },
        });
        return {
            cycle: { id: cycle.id, name: cycle.name, periodFrom: cycle.periodFrom, periodTo: cycle.periodTo, status: cycle.status, dueDate: cycle.dueDate },
            goals: goals.map((g) => ({
                id: g.id, title: g.title, description: g.description, category: g.category,
                weightPercent: g.weightPercent, status: g.status, completionPercent: g.completionPercent,
                agreedWithEmployee: g.agreedWithEmployee, evidenceNote: g.evidenceNote,
            })),
            review: review
                ? { status: review.status, selfAssessmentScore: review.selfAssessmentScore, reviewerScore: review.reviewerScore,
                    finalScore: review.finalScore, grade: review.grade, recommendation: review.recommendation,
                    reviewerComments: review.reviewerComments, strengths: review.strengths, improvements: review.improvements,
                    submittedAt: review.submittedAt, completedAt: review.completedAt }
                : null,
            history: history.filter((h) => h.completedAt).map((h) => ({
                cycle: h.cycle.name, grade: h.grade, finalScore: h.finalScore, recommendation: h.recommendation, completedAt: h.completedAt,
            })),
        };
    }
    async updateGoalProgress(goalId, dto, user) {
        const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
        if (!goal || goal.employeeId !== user.employeeId)
            throw new envelope_1.ForbiddenError('You can only update your own goals');
        const status = dto.completionPercent >= 100 ? 'COMPLETED' : dto.completionPercent > 0 ? 'IN_PROGRESS' : 'AGREED';
        await this.prisma.goal.update({
            where: { id: goalId },
            data: { completionPercent: dto.completionPercent, status, evidenceNote: dto.evidenceNote ?? goal.evidenceNote },
        });
        return { ok: true };
    }
    async submitSelfAssessment(dto, user) {
        const cycle = await this.prisma.appraisalCycle.findFirst({
            where: { institutionId: user.institutionId, status: { in: ['ACTIVE', 'REVIEW_UNDERWAY'] } },
            orderBy: { periodFrom: 'desc' },
        });
        if (!cycle)
            throw new envelope_1.BadRequestError('No active appraisal cycle');
        const review = await this.prisma.performanceReview.findUnique({
            where: { cycleId_employeeId: { cycleId: cycle.id, employeeId: user.employeeId } },
        });
        if (!review)
            throw new envelope_1.NotFoundError('You are not part of this cycle');
        if (review.status !== 'PENDING')
            throw new envelope_1.BadRequestError(`Self-assessment already submitted (${review.status})`);
        await this.prisma.performanceReview.update({
            where: { id: review.id },
            data: { selfAssessmentScore: dto.selfAssessmentScore, selfComments: dto.selfComments, status: 'SELF_SUBMITTED', submittedAt: new Date() },
        });
        const employee = await this.prisma.employee.findUnique({ where: { id: user.employeeId }, select: { departmentId: true, fullName: true } });
        if (employee?.departmentId) {
            const hods = await this.prisma.userRole.findMany({
                where: { role: { key: 'HOD' }, departmentId: employee.departmentId },
                select: { userId: true },
            });
            await this.engine.notifyMany(hods.map((h) => h.userId), 'APPRAISAL_UPDATE', 'Self-assessment awaiting your review', `${employee.fullName} submitted self-assessment (${dto.selfAssessmentScore}/100) for ${cycle.name}.`, '#/appraisal', 'INFO');
        }
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'SELF_ASSESSMENT_SUBMITTED', module: 'appraisal',
            entityType: 'PerformanceReview', entityId: review.id,
            summary: `${user.name} submitted self-assessment for ${cycle.name}`,
        });
        return { ok: true };
    }
    async team(user, cycleId) {
        const scope = (0, scope_1.scopeFor)(user, 'appraisal:read_all', 'appraisal:read_dept', 'appraisal:read_self');
        if (scope.kind === 'SELF')
            throw new envelope_1.ForbiddenError();
        const cycle = cycleId
            ? await this.prisma.appraisalCycle.findUnique({ where: { id: cycleId } })
            : await this.prisma.appraisalCycle.findFirst({ where: { institutionId: user.institutionId, status: { in: ['ACTIVE', 'REVIEW_UNDERWAY'] } }, orderBy: { periodFrom: 'desc' } });
        if (!cycle)
            return { cycle: null, reviews: [] };
        const where = { cycleId: cycle.id };
        if (scope.kind === 'DEPT')
            where.employee = { departmentId: { in: scope.departmentIds } };
        const reviews = await this.prisma.performanceReview.findMany({
            where,
            include: {
                employee: { select: { employeeCode: true, fullName: true, designation: { select: { title: true } }, department: { select: { name: true } } } },
            },
            orderBy: { employee: { fullName: 'asc' } },
            take: 200,
        });
        const goalCounts = await this.prisma.goal.groupBy({ by: ['employeeId'], where: { cycleId: cycle.id }, _count: { _all: true }, _avg: { completionPercent: true } });
        const goalMap = new Map(goalCounts.map((g) => [g.employeeId, { count: g._count._all, avg: g._avg.completionPercent ?? 0 }]));
        return {
            cycle: { id: cycle.id, name: cycle.name, status: cycle.status, dueDate: cycle.dueDate },
            reviews: reviews.map((r) => ({
                id: r.id,
                employee: r.employee,
                status: r.status,
                selfAssessmentScore: r.selfAssessmentScore,
                reviewerScore: r.reviewerScore,
                finalScore: r.finalScore,
                grade: r.grade,
                recommendation: r.recommendation,
                goals: goalMap.get(r.employeeId) ?? { count: 0, avg: 0 },
                submittedAt: r.submittedAt,
                completedAt: r.completedAt,
            })),
        };
    }
    async submitReview(reviewId, dto, user) {
        const review = await this.prisma.performanceReview.findUnique({
            where: { id: reviewId },
            include: { employee: { select: { id: true, departmentId: true, fullName: true } }, cycle: true },
        });
        if (!review)
            throw new envelope_1.NotFoundError('Review not found');
        if (review.status !== 'SELF_SUBMITTED' && review.status !== 'UNDER_REVIEW') {
            throw new envelope_1.BadRequestError(`Review is ${review.status}; awaiting self-assessment first`);
        }
        if (user.activeRoleKey === 'HOD') {
            const deptIds = (0, scope_1.deptIdsOf)(user);
            if (!review.employee.departmentId || !deptIds.includes(review.employee.departmentId)) {
                throw new envelope_1.ForbiddenError('This employee is outside your department');
            }
        }
        const finalScore = Math.round(((dto.reviewerScore + (review.selfAssessmentScore ?? dto.reviewerScore)) / 2) * 10) / 10;
        const grade = finalScore >= 90 ? 'OUTSTANDING' : finalScore >= 75 ? 'VERY_GOOD' : finalScore >= 60 ? 'GOOD' : finalScore >= 45 ? 'SATISFACTORY' : 'NEEDS_IMPROVEMENT';
        await this.prisma.performanceReview.update({
            where: { id: reviewId },
            data: {
                reviewerUserId: user.userId,
                reviewerScore: dto.reviewerScore,
                reviewerComments: dto.reviewerComments,
                strengths: dto.strengths ?? null,
                improvements: dto.improvements ?? null,
                finalScore,
                grade,
                recommendation: (dto.recommendation ?? 'NONE'),
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });
        if ((dto.recommendation ?? 'NONE') === 'PROMOTION') {
            await this.prisma.serviceEvent.create({
                data: {
                    employeeId: review.employee.id,
                    eventType: 'PROMOTION',
                    effectiveDate: new Date(),
                    details: `Recommended for promotion via ${review.cycle.name} appraisal (score ${finalScore})`,
                    referenceNo: `PRM-${Date.now().toString(36).toUpperCase()}`,
                },
            });
        }
        const employeeUser = await this.prisma.user.findUnique({ where: { employeeId: review.employee.id } });
        if (employeeUser) {
            await this.engine.notifyMany([employeeUser.id], 'APPRAISAL_UPDATE', 'Your appraisal is complete', `${review.cycle.name}: grade ${grade.replace('_', ' ')} (final ${finalScore}/100).${dto.reviewerComments ? ` Reviewer: ${dto.reviewerComments.slice(0, 120)}` : ''}`, '#/appraisal', 'SUCCESS');
        }
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'APPRAISAL_REVIEWED', module: 'appraisal',
            entityType: 'PerformanceReview', entityId: reviewId,
            summary: `${review.employee.fullName} reviewed — ${grade} (${finalScore}/100)`,
        });
        return { finalScore, grade };
    }
    async createGoal(dto, user) {
        const cycle = await this.prisma.appraisalCycle.findFirst({
            where: { institutionId: user.institutionId, status: { in: ['ACTIVE', 'REVIEW_UNDERWAY'] } },
            orderBy: { periodFrom: 'desc' },
        });
        if (!cycle)
            throw new envelope_1.BadRequestError('No active appraisal cycle');
        const emp = await this.prisma.employee.findUnique({ where: { employeeCode: dto.employeeCode } });
        if (!emp)
            throw new envelope_1.NotFoundError('Employee not found');
        if (user.activeRoleKey === 'HOD') {
            const deptIds = (0, scope_1.deptIdsOf)(user);
            if (!emp.departmentId || !deptIds.includes(emp.departmentId))
                throw new envelope_1.ForbiddenError('Outside your department');
        }
        const goal = await this.prisma.goal.create({
            data: {
                cycleId: cycle.id, employeeId: emp.id, title: dto.title, description: dto.description ?? null,
                category: dto.category, weightPercent: dto.weightPercent, setByUserId: user.userId, status: 'AGREED',
            },
        });
        return { id: goal.id };
    }
    async summary(user) {
        const cycle = await this.prisma.appraisalCycle.findFirst({
            where: { institutionId: user.institutionId, status: { in: ['ACTIVE', 'REVIEW_UNDERWAY', 'COMPLETED'] } },
            orderBy: { periodFrom: 'desc' },
        });
        if (!cycle)
            return { cycle: null, grades: {}, status: {} };
        const [grades, statuses] = await Promise.all([
            this.prisma.performanceReview.groupBy({ by: ['grade'], where: { cycleId: cycle.id }, _count: { _all: true } }),
            this.prisma.performanceReview.groupBy({ by: ['status'], where: { cycleId: cycle.id }, _count: { _all: true } }),
        ]);
        return {
            cycle: { id: cycle.id, name: cycle.name },
            grades: Object.fromEntries(grades.map((g) => [g.grade ?? 'PENDING', g._count._all])),
            status: Object.fromEntries(statuses.map((s) => [s.status, s._count._all])),
        };
    }
};
exports.AppraisalService = AppraisalService;
exports.AppraisalService = AppraisalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, approval_engine_service_1.ApprovalEngine])
], AppraisalService);
//# sourceMappingURL=appraisal.service.js.map