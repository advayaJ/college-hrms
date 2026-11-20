import { Injectable } from '@nestjs/common'
import { ApplicationStatus, InterviewKind, InterviewMode, InterviewStatus, Prisma, Recommendation } from '@prisma/client'
import { IsDateString, IsEmail, IsEnum, IsInt, IsIn, IsNumber, IsOptional, IsString, Length, Matches, Max, Min, MinLength } from 'class-validator'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../../core/audit/audit.service'
import { ApprovalEngine } from '../../core/approvals/approval-engine.service'
import { SessionUser } from '../../core/auth/auth.types'
import { deptIdsOf } from '../../core/scope'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../core/http/envelope'

export class CreateVacancyDto {
  @IsOptional() @IsString() departmentId?: string
  @IsString() campusId!: string
  @IsOptional() @IsString() designationId?: string
  @IsString() @MinLength(6) title!: string
  @IsIn(['PERMANENT', 'CONTRACT', 'VISITING', 'PART_TIME', 'ADJUNCT']) employmentType!: string
  @IsInt() @Min(1) @Max(10) openings!: number
  @IsOptional() @IsString() minQualification?: string
  @IsOptional() @IsString() specialization?: string
  @IsOptional() @IsNumber() experienceMinYears?: number
  @IsOptional() @IsInt() salaryRangeMin?: number
  @IsOptional() @IsInt() salaryRangeMax?: number
  @IsString() @MinLength(20) description!: string
  @IsOptional() @IsString() justification?: string
  @IsOptional() @IsDateString() targetJoinBy?: string
}

export class CreateCandidateDto {
  @IsString() @Length(1, 40) firstName!: string
  @IsString() @Length(1, 40) lastName!: string
  @IsEmail() email!: string
  @IsString() @Matches(/^[0-9+\-\s]{10,15}$/) phone!: string
  @IsString() city!: string
  @IsString() state!: string
  @IsString() highestQualification!: string
  @IsOptional() @IsString() specialization?: string
  @IsNumber() experienceYears!: number
  @IsOptional() @IsString() currentEmployer?: string
  @IsOptional() @IsInt() currentCtc?: number
  @IsOptional() @IsInt() expectedCtc?: number
  @IsIn(['JOB_PORTAL', 'REFERRAL', 'WALK_IN', 'CAMPUS', 'CONSULTANT']) source!: string
  @IsOptional() @IsString() notes?: string
}

export class ScheduleInterviewDto {
  @IsIn(['SCREENING', 'TECHNICAL', 'TEACHING_DEMO', 'HR_ROUND', 'MANAGEMENT']) kind!: string
  @IsIn(['IN_PERSON', 'ONLINE', 'TELEPHONIC']) mode!: string
  @IsDateString() scheduledAt!: string
  @IsString() venueOrLink!: string
  @IsOptional() @IsInt() @Min(15) @Max(240) durationMin?: number
  @IsOptional() @IsString() panel?: string // comma-separated names
}

export class FeedbackDto {
  @IsInt() @Min(1) @Max(5) overallRating!: number
  @IsString() @MinLength(15) feedback!: string
  @IsIn(['STRONG_HIRE', 'HIRE', 'HOLD', 'NO_HIRE']) recommendation!: string
}

export class OfferDto {
  @IsInt() @Min(10000) offerCtc!: number
  @IsOptional() @IsDateString() offerDeadline?: string
}

export class OnboardDto {
  @IsDateString() joiningDate!: string
}

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService, private audit: AuditService, private engine: ApprovalEngine) {}

  private vacancyVisibility(user: SessionUser): Prisma.VacancyWhereInput {
    if (user.permissions.includes('recruitment:manage') || user.permissions.includes('recruitment:shortlist')) {
      const deptIds = deptIdsOf(user)
      // HR sees everything; HOD sees own department plus unassigned posts
      return deptIds.length > 0 && user.activeRoleKey === 'HOD'
        ? { OR: [{ departmentId: { in: deptIds } }, { departmentId: null }] }
        : {}
    }
    return { status: 'OPEN' }
  }

  async vacancies(user: SessionUser, filters: { status?: string; q?: string }) {
    const where: Prisma.VacancyWhereInput = this.vacancyVisibility(user)
    if (filters.status) where.status = filters.status as Prisma.EnumVacancyStatusFilter['equals']
    if (filters.q) where.title = { contains: filters.q, mode: 'insensitive' }
    const rows = await this.prisma.vacancy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        department: true, designation: true, campus: true,
        _count: { select: { applications: true } },
      },
    })
    const ids = rows.map((r) => r.id)
    const apps = ids.length
      ? await this.prisma.application.groupBy({ by: ['vacancyId', 'status'], where: { vacancyId: { in: ids } }, _count: { _all: true } })
      : []
    const stageMap = new Map<string, Record<string, number>>()
    for (const a of apps) {
      const m = stageMap.get(a.vacancyId) ?? {}
      m[a.status] = a._count._all
      stageMap.set(a.vacancyId, m)
    }
    return rows.map((v) => ({
      id: v.id,
      requisitionNo: v.requisitionNo,
      title: v.title,
      department: v.department?.name ?? null,
      designation: v.designation?.title ?? null,
      campus: v.campus.name,
      employmentType: v.employmentType,
      openings: v.openings,
      filledCount: v.filledCount,
      status: v.status,
      openedAt: v.openedAt,
      targetJoinBy: v.targetJoinBy,
      approvalRequestId: v.approvalRequestId,
      applicationCount: v._count.applications,
      stages: stageMap.get(v.id) ?? {},
      salaryRangeMin: v.salaryRangeMin,
      salaryRangeMax: v.salaryRangeMax,
    }))
  }

  async vacancyDetail(id: string, user: SessionUser) {
    const v = await this.prisma.vacancy.findUnique({
      where: { id },
      include: { department: true, designation: true, campus: true },
    })
    if (!v) throw new NotFoundError('Vacancy not found')
    const apps = await this.prisma.application.findMany({
      where: { vacancyId: id },
      orderBy: { appliedAt: 'desc' },
      include: { candidate: true, interviews: { orderBy: { roundNo: 'asc' } } },
    })
    return {
      vacancy: {
        id: v.id, requisitionNo: v.requisitionNo, title: v.title, description: v.description,
        department: v.department?.name ?? null, designation: v.designation?.title ?? null, campus: v.campus.name,
        employmentType: v.employmentType, openings: v.openings, filledCount: v.filledCount,
        status: v.status, openedAt: v.openedAt, targetJoinBy: v.targetJoinBy,
        salaryRangeMin: v.salaryRangeMin, salaryRangeMax: v.salaryRangeMax,
        justification: v.justification, approvalRequestId: v.approvalRequestId,
      },
      applications: apps.map((a) => ({
        id: a.id,
        status: a.status,
        appliedAt: a.appliedAt,
        rating: a.rating,
        shortlistNote: a.shortlistNote,
        offerCtc: a.offerCtc,
        offerSentAt: a.offerSentAt,
        joinedOn: a.joinedOn,
        onboardedEmployeeCode: a.onboardedEmployeeCode,
        rejectReason: a.rejectReason,
        candidate: {
          candidateCode: a.candidate.candidateCode,
          name: `${a.candidate.firstName} ${a.candidate.lastName}`,
          email: a.candidate.email, phone: a.candidate.phone, city: a.candidate.city,
          highestQualification: a.candidate.highestQualification,
          specialization: a.candidate.specialization,
          experienceYears: a.candidate.experienceYears,
          expectedCtc: a.candidate.expectedCtc, currentCtc: a.candidate.currentCtc,
          source: a.candidate.source,
        },
        interviews: a.interviews.map((i) => ({
          id: i.id, roundNo: i.roundNo, kind: i.kind, mode: i.mode, scheduledAt: i.scheduledAt,
          venueOrLink: i.venueOrLink, status: i.status, overallRating: i.overallRating,
          recommendation: i.recommendation, feedback: i.feedback, panel: i.panel,
        })),
      })),
    }
  }

  async createVacancy(dto: CreateVacancyDto, user: SessionUser) {
    const count = await this.prisma.vacancy.count({ where: { institutionId: user.institutionId } })
    const requisitionNo = `REQ-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`
    const v = await this.prisma.vacancy.create({
      data: {
        requisitionNo,
        institutionId: user.institutionId,
        departmentId: dto.departmentId ?? null,
        campusId: dto.campusId,
        designationId: dto.designationId ?? null,
        title: dto.title,
        employmentType: dto.employmentType as never,
        openings: dto.openings,
        minQualification: dto.minQualification ?? null,
        specialization: dto.specialization ?? null,
        experienceMinYears: dto.experienceMinYears ?? null,
        salaryRangeMin: dto.salaryRangeMin ?? null,
        salaryRangeMax: dto.salaryRangeMax ?? null,
        description: dto.description,
        justification: dto.justification ?? null,
        status: 'DRAFT',
        targetJoinBy: dto.targetJoinBy ? new Date(dto.targetJoinBy) : null,
        createdByUserId: user.userId,
      },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'VACANCY_CREATED', module: 'recruitment',
      entityType: 'Vacancy', entityId: v.id, summary: `Requisition ${requisitionNo} drafted — ${dto.title}`,
    })
    return { id: v.id, requisitionNo }
  }

  async submitVacancy(id: string, user: SessionUser) {
    const v = await this.prisma.vacancy.findUnique({ where: { id } })
    if (!v || v.status !== 'DRAFT') throw new BadRequestError('Only draft vacancies can be submitted')
    const dept = await this.prisma.department.findUnique({ where: { id: v.departmentId ?? '' } }).catch(() => null)
    const request = await this.engine.submit({
      docType: 'VACANCY_REQUISITION',
      docId: v.id,
      title: `${v.title} (${v.openings} post${v.openings > 1 ? 's' : ''})`,
      institutionId: v.institutionId,
      initiatedByUserId: user.userId,
      initiatorName: user.name,
      contextDepartmentId: v.departmentId,
    })
    await this.prisma.vacancy.update({ where: { id }, data: { status: 'PENDING_APPROVAL', approvalRequestId: request.id } })
    return { approvalRef: request.referenceNo }
  }

  async applyVacancyOutcome(vacancyId: string, outcome: 'APPROVED' | 'REJECTED' | 'RETURNED', note: string | null) {
    const v = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } })
    if (!v) return
    if (outcome === 'APPROVED') {
      await this.prisma.vacancy.update({ where: { id: vacancyId }, data: { status: 'OPEN', openedAt: new Date() } })
    } else {
      await this.prisma.vacancy.update({
        where: { id: vacancyId },
        data: { status: 'DRAFT', justification: note ? `${v.justification ?? ''}\nReview note: ${note}`.trim() : v.justification },
      })
    }
  }

  async candidates(user: SessionUser, q?: string) {
    if (!user.permissions.includes('recruitment:manage') && !user.permissions.includes('recruitment:shortlist')) {
      throw new ForbiddenError()
    }
    const rows = await this.prisma.candidate.findMany({
      where: q
        ? { OR: [{ firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { candidateCode: { contains: q.toUpperCase() } }] }
        : {},
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: { applications: { select: { status: true, vacancy: { select: { title: true } } } } },
    })
    return rows.map((c) => ({
      candidateCode: c.candidateCode,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email, phone: c.phone, city: c.city,
      highestQualification: c.highestQualification, specialization: c.specialization,
      experienceYears: c.experienceYears, expectedCtc: c.expectedCtc, source: c.source,
      applications: c.applications.map((a) => ({ status: a.status, vacancy: a.vacancy.title })),
    }))
  }

  async createCandidate(dto: CreateCandidateDto, user: SessionUser) {
    const dup = await this.prisma.candidate.findFirst({ where: { email: dto.email } })
    if (dup) throw new BadRequestError('A candidate with this email already exists')
    const count = await this.prisma.candidate.count()
    const c = await this.prisma.candidate.create({
      data: {
        candidateCode: `CND-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
        firstName: dto.firstName, lastName: dto.lastName, email: dto.email, phone: dto.phone,
        city: dto.city, state: dto.state,
        highestQualification: dto.highestQualification, specialization: dto.specialization ?? null,
        experienceYears: dto.experienceYears, currentEmployer: dto.currentEmployer ?? null,
        currentCtc: dto.currentCtc ?? null, expectedCtc: dto.expectedCtc ?? null,
        source: dto.source as never, notes: dto.notes ?? null,
      },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'CANDIDATE_CREATED', module: 'recruitment',
      entityType: 'Candidate', entityId: c.id, summary: `Candidate ${c.candidateCode} added (${dto.firstName} ${dto.lastName})`,
    })
    return { candidateCode: c.candidateCode }
  }

  async createApplication(vacancyId: string, candidateCode: string, user: SessionUser) {
    const v = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } })
    if (!v || v.status !== 'OPEN') throw new BadRequestError('Vacancy is not open for applications')
    const c = await this.prisma.candidate.findUnique({ where: { candidateCode } })
    if (!c) throw new NotFoundError('Candidate not found')
    const dup = await this.prisma.application.findFirst({ where: { vacancyId, candidateId: c.id } })
    if (dup) throw new BadRequestError('Candidate has already applied to this vacancy')
    const app = await this.prisma.application.create({ data: { vacancyId, candidateId: c.id, status: 'APPLIED' } })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'APPLICATION_CREATED', module: 'recruitment',
      entityType: 'Application', entityId: app.id, summary: `${c.candidateCode} applied to ${v.requisitionNo}`,
    })
    return { id: app.id }
  }

  async shortlist(applicationId: string, note: string | undefined, rating: number | undefined, user: SessionUser) {
    const app = await this.prisma.application.findUnique({ where: { id: applicationId }, include: { vacancy: true } })
    if (!app) throw new NotFoundError('Application not found')
    if (app.status !== 'APPLIED' && app.status !== 'WAITLISTED') throw new BadRequestError(`Cannot shortlist a ${app.status} application`)
    await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: 'SHORTLISTED', shortlistNote: note ?? null, rating: rating ?? null },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'CANDIDATE_SHORTLISTED', module: 'recruitment',
      entityType: 'Application', entityId: applicationId,
      summary: `${app.candidateId} shortlisted for ${app.vacancy.requisitionNo}`,
    })
    return { ok: true }
  }

  async rejectApplication(applicationId: string, reason: string, user: SessionUser) {
    const app = await this.prisma.application.findUnique({ where: { id: applicationId } })
    if (!app) throw new NotFoundError('Application not found')
    if (['ONBOARDED', 'OFFER_ACCEPTED'].includes(app.status)) throw new BadRequestError('Cannot reject at this stage')
    await this.prisma.application.update({ where: { id: applicationId }, data: { status: 'REJECTED', rejectReason: reason } })
    return { ok: true }
  }

  async scheduleInterview(applicationId: string, dto: ScheduleInterviewDto, user: SessionUser) {
    const app = await this.prisma.application.findUnique({ where: { id: applicationId }, include: { vacancy: true } })
    if (!app) throw new NotFoundError('Application not found')
    if (!['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED'].includes(app.status)) {
      throw new BadRequestError('Shortlist the candidate before scheduling interviews')
    }
    const round = await this.prisma.interview.count({ where: { applicationId } }) + 1
    await this.prisma.interview.create({
      data: {
        applicationId,
        roundNo: round,
        kind: dto.kind as InterviewKind,
        mode: dto.mode as InterviewMode,
        scheduledAt: new Date(dto.scheduledAt),
        venueOrLink: dto.venueOrLink,
        durationMin: dto.durationMin ?? 45,
        status: 'SCHEDULED',
        panel: dto.panel ? { members: dto.panel.split(',').map((s) => s.trim()).filter(Boolean) } : undefined,
      },
    })
    await this.prisma.application.update({ where: { id: applicationId }, data: { status: 'INTERVIEW_SCHEDULED' } })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'INTERVIEW_SCHEDULED', module: 'recruitment',
      entityType: 'Application', entityId: applicationId,
      summary: `Interview round ${round} (${dto.kind}) scheduled for ${app.vacancy.requisitionNo}`,
    })
    return { roundNo: round }
  }

  async recordFeedback(interviewId: string, dto: FeedbackDto, user: SessionUser) {
    const i = await this.prisma.interview.findUnique({ where: { id: interviewId }, include: { application: true } })
    if (!i) throw new NotFoundError('Interview not found')
    if (i.status !== 'SCHEDULED') throw new BadRequestError('Interview is not scheduled')
    await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: 'COMPLETED' as InterviewStatus,
        overallRating: dto.overallRating,
        feedback: dto.feedback,
        recommendation: dto.recommendation as Recommendation,
        decidedAt: new Date(),
        decidedBy: user.name,
      },
    })
    await this.prisma.application.update({ where: { id: i.applicationId }, data: { status: 'INTERVIEWED' } })
    return { ok: true }
  }

  async makeOffer(applicationId: string, dto: OfferDto, user: SessionUser) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { vacancy: true, candidate: true },
    })
    if (!app) throw new NotFoundError('Application not found')
    if (!['INTERVIEWED', 'SELECTED'].includes(app.status)) throw new BadRequestError('Interview must be completed before an offer')
    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'OFFERED',
        offerCtc: dto.offerCtc,
        offerSentAt: new Date(),
        offerDeadline: dto.offerDeadline ? new Date(dto.offerDeadline) : null,
      },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'OFFER_MADE', module: 'recruitment',
      entityType: 'Application', entityId: applicationId,
      summary: `Offer of ₹${dto.offerCtc.toLocaleString('en-IN')} made to ${app.candidate.firstName} ${app.candidate.lastName}`,
    })
    return { ok: true }
  }

  async offerResponse(applicationId: string, accepted: boolean, user: SessionUser) {
    const app = await this.prisma.application.findUnique({ where: { id: applicationId } })
    if (!app || app.status !== 'OFFERED') throw new BadRequestError('No pending offer on this application')
    await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: accepted ? 'OFFER_ACCEPTED' : 'REJECTED', rejectReason: accepted ? null : 'Offer declined by candidate' },
    })
    return { ok: true }
  }

  async onboard(applicationId: string, dto: OnboardDto, user: SessionUser) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { vacancy: { include: { designation: true, department: true } }, candidate: true },
    })
    if (!app || app.status !== 'OFFER_ACCEPTED') throw new BadRequestError('Only accepted offers can be onboarded')
    if (app.onboardedEmployeeCode) throw new BadRequestError('Already onboarded')
    const vacancy = app.vacancy
    if (!vacancy.designation) throw new BadRequestError('Vacancy needs a designation for onboarding')

    const codeRow = await this.prisma.$queryRawUnsafe<Array<{ next: number }>>(
      'SELECT COALESCE(MAX(CAST(SUBSTRING("employeeCode" FROM 5) AS INTEGER)), 1000) + 1 AS next FROM "Employee"'
    )
    const code = `EMP-${codeRow[0]?.next ?? 1001}`
    const c = app.candidate
    const joining = new Date(dto.joiningDate)
    const fullName = `${c.firstName} ${c.lastName}`
    const basic = Math.round((app.offerCtc ?? vacancy.salaryRangeMin ?? 57700) / 1.7)
    const emp = await this.prisma.employee.create({
      data: {
        employeeCode: code,
        institutionId: vacancy.institutionId,
        campusId: vacancy.campusId,
        departmentId: vacancy.departmentId,
        designationId: vacancy.designationId,
        staffType: vacancy.designation.category,
        employmentType: vacancy.employmentType,
        status: 'PROBATION',
        title: vacancy.designation.category === 'TEACHING' ? 'Dr./Prof.' : 'Mr./Ms.',
        firstName: c.firstName, lastName: c.lastName, fullName,
        gender: 'MALE',
        dateOfBirth: new Date(1995, 0, 1),
        personalEmail: c.email, officialEmail: `${c.firstName.toLowerCase()}.${c.lastName.toLowerCase()}${code.slice(-2)}@aryavratt.edu.in`,
        phone: c.phone,
        addressLine: '—', city: c.city, state: c.state, pincode: '313001',
        joiningDate: joining,
        probationEndDate: new Date(joining.getTime() + 365 * 24 * 3600 * 1000),
        photoSeed: Math.floor(Math.random() * 1000),
        serviceEvents: { create: { eventType: 'JOINING', effectiveDate: joining, details: `Joined via recruitment (${vacancy.requisitionNo}) as ${vacancy.designation.title}`, referenceNo: `JOIN-${code}` } },
        salaryStructure: {
          create: {
            effectiveFrom: joining, basicMonthly: basic,
            components: {
              create: [
                { code: 'BASIC', name: 'Basic Pay', kind: 'EARNING', calcType: 'FIXED', value: basic },
                { code: 'DA', name: 'Dearness Allowance', kind: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 42 },
                { code: 'HRA', name: 'House Rent Allowance', kind: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 20 },
                { code: 'CONVY', name: 'Conveyance Allowance', kind: 'EARNING', calcType: 'FIXED', value: 1600 },
                { code: 'MEDICAL', name: 'Medical Allowance', kind: 'EARNING', calcType: 'FIXED', value: 1250 },
                { code: 'SPECIAL', name: 'Special Allowance', kind: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 9 },
              ],
            },
          },
        },
      },
    })
    const { hash } = await import('bcryptjs')
    await this.prisma.user.create({
      data: {
        email: emp.officialEmail, employeeId: emp.id,
        passwordHash: await hash('Welcome@2026', 10),
        userRoles: {
          create: {
            roleId: (await this.prisma.role.findUnique({ where: { key: emp.staffType === 'TEACHING' ? 'FACULTY' : emp.staffType === 'TECHNICAL' ? 'TECHNICAL_STAFF' : 'NON_TEACHING_STAFF' } }))!.id,
          },
        },
      },
    })
    const filled = vacancy.filledCount + 1
    await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: 'ONBOARDED', joinedOn: joining, onboardedEmployeeCode: code },
    })
    await this.prisma.vacancy.update({
      where: { id: vacancy.id },
      data: { filledCount: filled, status: filled >= vacancy.openings ? 'CLOSED' : 'OPEN', closedAt: filled >= vacancy.openings ? new Date() : null },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'CANDIDATE_ONBOARDED', module: 'recruitment',
      entityType: 'Application', entityId: applicationId,
      summary: `${fullName} onboarded as ${code} — ${vacancy.designation.title}`,
    })
    return { employeeCode: code, officialEmail: emp.officialEmail }
  }

  async pipeline(user: SessionUser) {
    const stages = await this.prisma.application.groupBy({ by: ['status'], _count: { _all: true } })
    const openVacancies = await this.prisma.vacancy.count({ where: { status: 'OPEN' } })
    const upcoming = await this.prisma.interview.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: 'asc' },
      take: 8,
      include: { application: { include: { candidate: true, vacancy: { select: { title: true } } } } },
    })
    return {
      stages: Object.fromEntries(stages.map((s) => [s.status, s._count._all])),
      openVacancies,
      upcomingInterviews: upcoming.map((i) => ({
        id: i.id, roundNo: i.roundNo, kind: i.kind, mode: i.mode, scheduledAt: i.scheduledAt,
        candidate: `${i.application.candidate.firstName} ${i.application.candidate.lastName}`,
        vacancy: i.application.vacancy.title,
      })),
    }
  }
}
