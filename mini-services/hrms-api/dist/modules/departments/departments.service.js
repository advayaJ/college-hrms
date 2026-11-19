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
exports.DepartmentsService = exports.CreateDesignationDto = exports.CreateCampusDto = exports.UpdateDepartmentDto = exports.CreateDepartmentDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../core/audit/audit.service");
const envelope_1 = require("../../core/http/envelope");
const class_validator_1 = require("class-validator");
class CreateDepartmentDto {
    code;
    name;
    campusId;
    facultyId;
    establishedYear;
    hodEmployeeCode;
}
exports.CreateDepartmentDto = CreateDepartmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "campusId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "facultyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1960),
    (0, class_validator_1.Max)(2030),
    __metadata("design:type", Number)
], CreateDepartmentDto.prototype, "establishedYear", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "hodEmployeeCode", void 0);
class UpdateDepartmentDto {
    name;
    campusId;
    facultyId;
    hodEmployeeCode;
    isActive;
}
exports.UpdateDepartmentDto = UpdateDepartmentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDepartmentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDepartmentDto.prototype, "campusId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDepartmentDto.prototype, "facultyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDepartmentDto.prototype, "hodEmployeeCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([true, false]),
    __metadata("design:type", Boolean)
], UpdateDepartmentDto.prototype, "isActive", void 0);
class CreateCampusDto {
    code;
    name;
    city;
    state;
    addressLine;
    isMain;
}
exports.CreateCampusDto = CreateCampusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampusDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampusDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampusDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampusDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampusDto.prototype, "addressLine", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([true, false]),
    __metadata("design:type", Boolean)
], CreateCampusDto.prototype, "isMain", void 0);
class CreateDesignationDto {
    code;
    title;
    category;
    payLevel;
    minBasic;
    maxBasic;
}
exports.CreateDesignationDto = CreateDesignationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDesignationDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDesignationDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['TEACHING', 'NON_TEACHING', 'TECHNICAL']),
    __metadata("design:type", String)
], CreateDesignationDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(18),
    __metadata("design:type", Number)
], CreateDesignationDto.prototype, "payLevel", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(10000),
    __metadata("design:type", Number)
], CreateDesignationDto.prototype, "minBasic", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Max)(300000),
    __metadata("design:type", Number)
], CreateDesignationDto.prototype, "maxBasic", void 0);
let DepartmentsService = class DepartmentsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async list(user) {
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
        ]);
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
        };
    }
    async detail(id, user) {
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
        });
        if (!dept || dept.institutionId !== user.institutionId)
            throw new envelope_1.NotFoundError('Department not found');
        const term = await this.prisma.academicTerm.findFirst({
            where: { institutionId: user.institutionId, isActive: true },
            include: { workloadEntries: { where: { departmentId: id } } },
        });
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
        };
    }
    async create(dto, user) {
        const dup = await this.prisma.department.findUnique({ where: { code: dto.code } });
        if (dup)
            throw new envelope_1.BadRequestError(`Department code ${dto.code} already exists`);
        let hodId = null;
        if (dto.hodEmployeeCode) {
            const hod = await this.prisma.employee.findUnique({ where: { employeeCode: dto.hodEmployeeCode } });
            if (!hod)
                throw new envelope_1.BadRequestError('HOD employee code not found');
            hodId = hod.id;
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
        });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'DEPARTMENT_CREATED', module: 'departments',
            entityType: 'Department', entityId: dept.id, summary: `Department ${dto.name} (${dto.code}) created`,
        });
        return { id: dept.id, code: dept.code };
    }
    async update(id, dto, user) {
        const dept = await this.prisma.department.findUnique({ where: { id } });
        if (!dept || dept.institutionId !== user.institutionId)
            throw new envelope_1.NotFoundError('Department not found');
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.campusId !== undefined)
            data.campusId = dto.campusId;
        if (dto.facultyId !== undefined)
            data.facultyId = dto.facultyId ?? null;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.hodEmployeeCode !== undefined) {
            if (dto.hodEmployeeCode === '') {
                data.hodId = null;
            }
            else {
                const hod = await this.prisma.employee.findUnique({ where: { employeeCode: dto.hodEmployeeCode } });
                if (!hod)
                    throw new envelope_1.BadRequestError('HOD employee code not found');
                data.hodId = hod.id;
            }
        }
        await this.prisma.department.update({ where: { id }, data });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'DEPARTMENT_UPDATED', module: 'departments',
            entityType: 'Department', entityId: id, summary: `Department ${dept.name} updated`,
        });
        return { ok: true };
    }
    async createCampus(dto, user) {
        const campus = await this.prisma.campus.create({
            data: {
                institutionId: user.institutionId, code: dto.code, name: dto.name,
                city: dto.city, state: dto.state, addressLine: dto.addressLine, isMain: dto.isMain ?? false,
            },
        });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'CAMPUS_CREATED', module: 'departments',
            entityType: 'Campus', entityId: campus.id, summary: `Campus ${dto.name} created`,
        });
        return { id: campus.id };
    }
    async createDesignation(dto, user) {
        if (dto.minBasic > dto.maxBasic)
            throw new envelope_1.BadRequestError('minBasic must be ≤ maxBasic');
        const desig = await this.prisma.designation.create({
            data: {
                institutionId: user.institutionId, code: dto.code, title: dto.title,
                category: dto.category, payLevel: dto.payLevel, minBasic: dto.minBasic, maxBasic: dto.maxBasic,
            },
        });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'DESIGNATION_CREATED', module: 'departments',
            entityType: 'Designation', entityId: desig.id, summary: `Designation ${dto.title} created`,
        });
        return { id: desig.id };
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map