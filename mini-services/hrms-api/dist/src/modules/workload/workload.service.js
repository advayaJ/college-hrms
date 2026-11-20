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
exports.WorkloadService = exports.CreateSubjectDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../core/audit/audit.service");
const scope_1 = require("../../core/scope");
const envelope_1 = require("../../core/http/envelope");
class CreateSubjectDto {
    termId;
    departmentId;
    employeeCode;
    code;
    title;
    lectureHours;
    tutorialHours;
    labHours;
    credits;
    groups;
}
exports.CreateSubjectDto = CreateSubjectDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "termId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "employeeCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubjectDto.prototype, "lectureHours", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubjectDto.prototype, "tutorialHours", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubjectDto.prototype, "labHours", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubjectDto.prototype, "credits", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], CreateSubjectDto.prototype, "groups", void 0);
let WorkloadService = class WorkloadService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async terms(user) {
        return this.prisma.academicTerm.findMany({
            where: { institutionId: user.institutionId },
            orderBy: { startDate: 'desc' },
        });
    }
    async overview(user, termId, departmentId) {
        const scope = (0, scope_1.scopeFor)(user, 'workload:read_all', 'workload:read_dept', 'workload:read_self');
        if (scope.kind === 'SELF')
            return this.selfView(user);
        const term = termId
            ? await this.prisma.academicTerm.findUnique({ where: { id: termId } })
            : await this.prisma.academicTerm.findFirst({ where: { institutionId: user.institutionId, isActive: true } });
        if (!term)
            return { term: null, entries: [], subjects: [], summary: null };
        const deptIds = departmentId ? [departmentId] : scope.kind === 'DEPT' ? scope.departmentIds : undefined;
        const entries = await this.prisma.workloadEntry.findMany({
            where: { termId: term.id, ...(deptIds ? { departmentId: { in: deptIds } } : {}) },
            include: {
                employee: { select: { employeeCode: true, fullName: true, designation: { select: { title: true } } } },
                department: { select: { name: true } },
            },
            orderBy: { totalLoadPoints: 'desc' },
        });
        const subjects = await this.prisma.subjectAllocation.findMany({
            where: { termId: term.id, ...(deptIds ? { departmentId: { in: deptIds } } : {}) },
            include: { employee: { select: { fullName: true, employeeCode: true } }, department: { select: { name: true } } },
            orderBy: [{ department: { name: 'asc' } }, { code: 'asc' }],
        });
        const byDept = new Map();
        for (const e of entries) {
            const key = e.department?.name ?? '—';
            const agg = byDept.get(key) ?? { department: key, faculty: 0, teachingHours: 0, overloaded: 0, avgLoad: 0 };
            agg.faculty++;
            agg.teachingHours += e.teachingHours + e.labHours + e.tutorialHours;
            if (e.isOverloaded)
                agg.overloaded++;
            agg.avgLoad += e.totalLoadPoints;
            byDept.set(key, agg);
        }
        for (const v of byDept.values())
            v.avgLoad = Math.round((v.avgLoad / Math.max(v.faculty, 1)) * 10) / 10;
        return {
            term: { id: term.id, name: term.name, kind: term.kind, startDate: term.startDate, endDate: term.endDate, isActive: term.isActive },
            entries: entries.map((e) => ({
                employee: e.employee, department: e.department?.name ?? null,
                teachingHours: e.teachingHours, labHours: e.labHours, tutorialHours: e.tutorialHours,
                supervisions: e.supervisions, adminPoints: e.adminPoints, researchPoints: e.researchPoints,
                totalLoadPoints: e.totalLoadPoints, standardHours: e.standardHours, isOverloaded: e.isOverloaded,
            })),
            subjects: subjects.map((s) => ({
                id: s.id, code: s.code, title: s.title, department: s.department?.name ?? null,
                employee: s.employee ? { code: s.employee.employeeCode, name: s.employee.fullName } : null,
                lectureHours: s.lectureHours, tutorialHours: s.tutorialHours, labHours: s.labHours,
                credits: s.credits, groups: s.groups,
            })),
            byDepartment: [...byDept.values()].sort((a, b) => b.teachingHours - a.teachingHours),
            summary: {
                faculty: entries.length,
                overloaded: entries.filter((e) => e.isOverloaded).length,
                totalTeachingHours: entries.reduce((s, e) => s + e.teachingHours + e.labHours + e.tutorialHours, 0),
                subjects: subjects.length,
                unassignedSubjects: subjects.filter((s) => !s.employee).length,
            },
        };
    }
    async selfView(user) {
        const term = await this.prisma.academicTerm.findFirst({ where: { institutionId: user.institutionId, isActive: true } });
        const [subjects, workload, research, mentoring, trainings, duties] = await Promise.all([
            this.prisma.subjectAllocation.findMany({
                where: { termId: term?.id, employeeId: user.employeeId },
                include: { department: { select: { name: true } } },
                orderBy: { code: 'asc' },
            }),
            this.prisma.workloadEntry.findUnique({ where: { termId_employeeId: { termId: term.id, employeeId: user.employeeId } } }).catch(() => null),
            this.prisma.researchOutput.findMany({ where: { employeeId: user.employeeId }, orderBy: { year: 'desc' } }),
            this.prisma.mentoringEntry.findMany({ where: { employeeId: user.employeeId }, orderBy: { year: 'desc' } }),
            this.prisma.trainingRecord.findMany({ where: { employeeId: user.employeeId }, orderBy: { fromDate: 'desc' } }),
            this.prisma.administrativeDuty.findMany({ where: { employeeId: user.employeeId } }),
        ]);
        return {
            term: term ? { id: term.id, name: term.name, isActive: term.isActive } : null,
            subjects: subjects.map((s) => ({
                code: s.code, title: s.title, department: s.department?.name ?? null,
                lectureHours: s.lectureHours, tutorialHours: s.tutorialHours, labHours: s.labHours,
                credits: s.credits, groups: s.groups,
            })),
            workload: workload
                ? {
                    teachingHours: workload.teachingHours, labHours: workload.labHours, tutorialHours: workload.tutorialHours,
                    supervisions: workload.supervisions, adminPoints: workload.adminPoints, researchPoints: workload.researchPoints,
                    totalLoadPoints: workload.totalLoadPoints, standardHours: workload.standardHours, isOverloaded: workload.isOverloaded,
                }
                : null,
            research: research.map((r) => ({
                outputType: r.outputType, title: r.title, venue: r.venue, year: r.year, indexedIn: r.indexedIn,
                status: r.status, amountSanctioned: r.amountSanctioned, authors: r.authors,
            })),
            mentoring: mentoring.map((m) => ({ kind: m.kind, studentOrTopic: m.studentOrTopic, count: m.count, year: m.year })),
            trainings: trainings.map((t) => ({ kind: t.kind, programTitle: t.programTitle, organiser: t.organiser, hours: t.hours, fromDate: t.fromDate, toDate: t.toDate, outcome: t.outcome })),
            adminDuties: duties.map((d) => ({ title: d.title, since: d.since, until: d.until, pointsPerWeek: d.pointsPerWeek })),
            totals: {
                publications: research.filter((r) => ['JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER'].includes(r.outputType)).length,
                projects: research.filter((r) => ['SPONSORED_PROJECT', 'CONSULTANCY'].includes(r.outputType)).length,
                trainingHours: trainings.reduce((s, t) => s + t.hours, 0),
                supervisions: mentoring.filter((m) => m.kind === 'PHD_SUPERVISION').reduce((s, m) => s + m.count, 0),
            },
        };
    }
    async createSubject(dto, user) {
        const dup = await this.prisma.subjectAllocation.findFirst({ where: { termId: dto.termId, code: dto.code } });
        if (dup)
            throw new envelope_1.BadRequestError(`Subject ${dto.code} already allocated this term`);
        let employeeId = null;
        if (dto.employeeCode) {
            const emp = await this.prisma.employee.findUnique({ where: { employeeCode: dto.employeeCode } });
            if (!emp)
                throw new envelope_1.NotFoundError('Employee not found');
            employeeId = emp.id;
        }
        const subject = await this.prisma.subjectAllocation.create({
            data: {
                termId: dto.termId, departmentId: dto.departmentId, employeeId,
                code: dto.code, title: dto.title,
                lectureHours: dto.lectureHours, tutorialHours: dto.tutorialHours, labHours: dto.labHours,
                credits: dto.credits, groups: dto.groups,
                academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            },
        });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'SUBJECT_ALLOCATED', module: 'workload',
            entityType: 'SubjectAllocation', entityId: subject.id,
            summary: `Subject ${dto.code} (${dto.title}) allocated${dto.employeeCode ? ` to ${dto.employeeCode}` : ' (unassigned)'}`,
        });
        return { id: subject.id };
    }
    async reassignSubject(subjectId, employeeCode, user) {
        const subject = await this.prisma.subjectAllocation.findUnique({ where: { id: subjectId } });
        if (!subject)
            throw new envelope_1.NotFoundError('Subject not found');
        const emp = await this.prisma.employee.findUnique({ where: { employeeCode } });
        if (!emp)
            throw new envelope_1.NotFoundError('Employee not found');
        if (user.activeRoleKey === 'HOD') {
            const deptIds = (0, scope_1.deptIdsOf)(user);
            if (!deptIds.includes(subject.departmentId))
                throw new envelope_1.ForbiddenError('Subject belongs to another department');
        }
        await this.prisma.subjectAllocation.update({ where: { id: subjectId }, data: { employeeId: emp.id } });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'SUBJECT_REASSIGNED', module: 'workload',
            entityType: 'SubjectAllocation', entityId: subjectId,
            summary: `Subject ${subject.code} reassigned to ${employeeCode}`,
        });
        return { ok: true };
    }
    async recompute(termId, departmentId, user) {
        const term = await this.prisma.academicTerm.findUnique({ where: { id: termId } });
        if (!term)
            throw new envelope_1.NotFoundError('Term not found');
        const subjects = await this.prisma.subjectAllocation.findMany({ where: { termId, departmentId } });
        const teachers = await this.prisma.employee.findMany({
            where: { departmentId, staffType: 'TEACHING', status: { in: ['ACTIVE', 'PROBATION', 'ON_NOTICE'] } },
            include: { adminDuties: true, researchOutputs: true, mentoringEntries: true },
        });
        const loadByEmp = new Map();
        for (const s of subjects) {
            if (!s.employeeId)
                continue;
            const l = loadByEmp.get(s.employeeId) ?? { teaching: 0, lab: 0, tutorial: 0 };
            l.teaching += s.lectureHours * s.groups;
            l.tutorial += s.tutorialHours * s.groups;
            l.lab += s.labHours * s.groups;
            loadByEmp.set(s.employeeId, l);
        }
        for (const t of teachers) {
            const l = loadByEmp.get(t.id) ?? { teaching: 0, lab: 0, tutorial: 0 };
            const supervisions = t.mentoringEntries.reduce((s, m) => s + m.count, 0);
            const adminPoints = t.adminDuties.reduce((s, d) => s + d.pointsPerWeek, 0);
            const recent = t.researchOutputs.filter((r) => r.year >= new Date().getFullYear() - 2);
            const researchPoints = recent.length * 2;
            const teachingHours = l.teaching + l.tutorial + l.lab * 0.5;
            const total = teachingHours + supervisions * 0.5 + adminPoints + researchPoints * 0.5;
            await this.prisma.workloadEntry.upsert({
                where: { termId_employeeId: { termId, employeeId: t.id } },
                create: {
                    termId, employeeId: t.id, departmentId,
                    teachingHours: l.teaching, tutorialHours: l.tutorial, labHours: l.lab,
                    supervisions, adminPoints, researchPoints,
                    totalLoadPoints: total, standardHours: 16, isOverloaded: l.teaching > 16,
                    computedAt: new Date(),
                },
                update: {
                    teachingHours: l.teaching, tutorialHours: l.tutorial, labHours: l.lab,
                    supervisions, adminPoints, researchPoints,
                    totalLoadPoints: total, isOverloaded: l.teaching > 16, computedAt: new Date(),
                },
            });
        }
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'WORKLOAD_RECOMPUTED', module: 'workload',
            entityType: 'WorkloadEntry', entityId: departmentId,
            summary: `Workload recomputed for ${teachers.length} teachers (${term.name})`,
        });
        return { teachers: teachers.length, subjects: subjects.length };
    }
};
exports.WorkloadService = WorkloadService;
exports.WorkloadService = WorkloadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], WorkloadService);
//# sourceMappingURL=workload.service.js.map