import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../../core/audit/audit.service'
import { SessionUser } from '../../core/auth/auth.types'
import { BadRequestError, NotFoundError } from '../../core/http/envelope'
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class CreateDepartmentDto {
  @IsString() code!: string
  @IsString() name!: string
  @IsString() campusId!: string
  @IsOptional() @IsString() facultyId?: string
  @IsOptional() @IsInt() @Min(1960) @Max(2030) establishedYear?: number
  @IsOptional() @IsString() hodEmployeeCode?: string
}

export class UpdateDepartmentDto {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() campusId?: string
  @IsOptional() @IsString() facultyId?: string
  @IsOptional() @IsString() hodEmployeeCode?: string
  @IsOptional() @IsIn([true, false]) isActive?: boolean
}

export class CreateCampusDto {
  @IsString() code!: string
  @IsString() name!: string
  @IsString() city!: string
  @IsString() state!: string
  @IsString() addressLine!: string
  @IsOptional() @IsIn([true, false]) isMain?: boolean
}

export class CreateDesignationDto {
  @IsString() code!: string
  @IsString() title!: string
  @IsString() @IsIn(['TEACHING', 'NON_TEACHING', 'TECHNICAL']) category!: string
  @IsInt() @Min(1) @Max(18) payLevel!: number
  @IsInt() @Min(10000) minBasic!: number
  @IsInt() @Max(300000) maxBasic!: number
}

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async list(user: SessionUser) {
    const [departments, campuses, faculties] = await Promise.all([
      this.prisma.department.findMany({
        where: { institutionId: user.institutionId },
        orderBy: [{ campus: { name: 'asc' } }, { name: 'asc' }],
        include: {
          campus: true,
          faculty: true,
          hod: true,
          _count: { select: { employees: { where: { status: { in: ['ACTIVE', 'PROBATION', 'ON_NOTICE', 'ON_LONG_LEAVE'] } } } } },
        },
      }),
      this.prisma.campus.findMany({
        where: { institutionId: user.institutionId },
        orderBy: { name: 'asc' },
        include: { _count: { select: { departments: true, employees: true } } },
      }),
      this.prisma.faculty.findMany({
        where: { institutionId: user.institutionId },
        orderBy: { name: 'asc' },
        include: { _count: { select: { departments: true } } },
      }),
    ])
    return {
      departments: departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        establishedYear: d.establishedYear,
        campus: d.campus.name,
        campusId: d.campusId,
        faculty: d.faculty?.name ?? null,
        facultyId: d.facultyId,
        hod: d.hod ? { code: d.hod.employeeCode, name: d.hod.fullName } : null,
        employeeCount: d._count.employees,
        isActive: d.isActive,
      })),
      campuses: campuses.map((c) => ({
        id: c.id, code: c.code, name: c.name, city: c.city, state: c.state,
        isMain: c.isMain, departmentCount: c._count.departments, employeeCount: c._count.employees,
      })),
      faculties: faculties.map((f) => ({
        id: f.id, code: f.code, name: f.name, kind: f.kind, departmentCount: f._count.departments,
      })),
    }
  }

  async detail(id: string, user: SessionUser) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        campus: true,
        faculty: true,
        hod: true,
        employees: {
          where: { status: { in: ['ACTIVE', 'PROBATION', 'ON_NOTICE', 'ON_LONG_LEAVE'] } },
          include: { designation: true },
          orderBy: { fullName: 'asc' },
        },
      },
    })
    if (!dept || dept.institutionId !== user.institutionId) throw new NotFoundError('Department not found')
    const term = await this.prisma.academicTerm.findFirst({
      where: { institutionId: user.institutionId, isActive: true },
      include: { workloadEntries: { where: { departmentId: id } } },
    })
    return {
      department: {
        id: dept.id, code: dept.code, name: dept.name, establishedYear: dept.establishedYear,
        campus: dept.campus.name, faculty: dept.faculty?.name ?? null,
        hod: dept.hod ? { code: dept.hod.employeeCode, name: dept.hod.fullName, email: dept.hod.officialEmail } : null,
        isActive: dept.isActive,
      },
      employees: dept.employees.map((e) => ({
        code: e.employeeCode, name: e.fullName, designation: e.designation?.title ?? null,
        staffType: e.staffType, status: e.status, joiningDate: e.joiningDate, photoSeed: e.photoSeed,
      })),
      workloadSummary: term
        ? {
            term: term.name,
            teachingHours: term.workloadEntries.reduce((s, w) => s + w.teachingHours + w.labHours, 0),
            overloadedCount: term.workloadEntries.filter((w) => w.isOverloaded).length,
            facultyCount: term.workloadEntries.length,
          }
        : null,
    }
  }

  async create(dto: CreateDepartmentDto, user: SessionUser) {
    const dup = await this.prisma.department.findUnique({ where: { code: dto.code } })
    if (dup) throw new BadRequestError(`Department code ${dto.code} already exists`)
    let hodId: string | null = null
    if (dto.hodEmployeeCode) {
      const hod = await this.prisma.employee.findUnique({ where: { employeeCode: dto.hodEmployeeCode } })
      if (!hod) throw new BadRequestError('HOD employee code not found')
      hodId = hod.id
    }
    const dept = await this.prisma.department.create({
      data: {
        institutionId: user.institutionId,
        campusId: dto.campusId,
        facultyId: dto.facultyId ?? null,
        code: dto.code,
        name: dto.name,
        establishedYear: dto.establishedYear ?? null,
        hodId,
      },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'DEPARTMENT_CREATED', module: 'departments',
      entityType: 'Department', entityId: dept.id, summary: `Department ${dto.name} (${dto.code}) created`,
    })
    return { id: dept.id, code: dept.code }
  }

  async update(id: string, dto: UpdateDepartmentDto, user: SessionUser) {
    const dept = await this.prisma.department.findUnique({ where: { id } })
    if (!dept || dept.institutionId !== user.institutionId) throw new NotFoundError('Department not found')
    const data: Record<string, unknown> = {}
    if (dto.name !== undefined) data.name = dto.name
    if (dto.campusId !== undefined) data.campusId = dto.campusId
    if (dto.facultyId !== undefined) data.facultyId = dto.facultyId ?? null
    if (dto.isActive !== undefined) data.isActive = dto.isActive
    if (dto.hodEmployeeCode !== undefined) {
      if (dto.hodEmployeeCode === '') { data.hodId = null } else {
        const hod = await this.prisma.employee.findUnique({ where: { employeeCode: dto.hodEmployeeCode } })
        if (!hod) throw new BadRequestError('HOD employee code not found')
        data.hodId = hod.id
      }
    }
    await this.prisma.department.update({ where: { id }, data })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'DEPARTMENT_UPDATED', module: 'departments',
      entityType: 'Department', entityId: id, summary: `Department ${dept.name} updated`,
    })
    return { ok: true }
  }

  async createCampus(dto: CreateCampusDto, user: SessionUser) {
    const campus = await this.prisma.campus.create({
      data: {
        institutionId: user.institutionId, code: dto.code, name: dto.name,
        city: dto.city, state: dto.state, addressLine: dto.addressLine, isMain: dto.isMain ?? false,
      },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'CAMPUS_CREATED', module: 'departments',
      entityType: 'Campus', entityId: campus.id, summary: `Campus ${dto.name} created`,
    })
    return { id: campus.id }
  }

  async createDesignation(dto: CreateDesignationDto, user: SessionUser) {
    if (dto.minBasic > dto.maxBasic) throw new BadRequestError('minBasic must be ≤ maxBasic')
    const desig = await this.prisma.designation.create({
      data: {
        institutionId: user.institutionId, code: dto.code, title: dto.title,
        category: dto.category as never, payLevel: dto.payLevel, minBasic: dto.minBasic, maxBasic: dto.maxBasic,
      },
    })
    await this.audit.record({
      userId: user.userId, actorEmail: user.email, action: 'DESIGNATION_CREATED', module: 'departments',
      entityType: 'Designation', entityId: desig.id, summary: `Designation ${dto.title} created`,
    })
    return { id: desig.id }
  }
}
