"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../core/audit/audit.service");
const scope_1 = require("../../core/scope");
const envelope_1 = require("../../core/http/envelope");
const EMAIL_DOMAIN = 'aryavratt.edu.in';
let EmployeesService = class EmployeesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async list(params, user) {
        const scope = (0, scope_1.scopeFor)(user, 'employees:read_all', 'employees:read_dept', 'employees:read_self');
        if (scope.kind === 'SELF') {
            const me = await this.prisma.employee.findUnique({ where: { id: user.employeeId } });
            return { items: [me ? this.listRow(me, true) : []].filter(Boolean), total: me ? 1 : 0, page: 1, pageSize: params.pageSize ?? 20 };
        }
        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
        const where = {};
        if (scope.kind === 'DEPT')
            where.departmentId = { in: scope.departmentIds };
        if (params.departmentId)
            where.departmentId = params.departmentId;
        if (params.campusId)
            where.campusId = params.campusId;
        if (params.staffType)
            where.staffType = params.staffType;
        if (params.status)
            where.status = params.status;
        if (params.q) {
            where.OR = [
                { fullName: { contains: params.q, mode: 'insensitive' } },
                { employeeCode: { contains: params.q.toUpperCase(), mode: 'insensitive' } },
            ];
        }
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.employee.count({ where }),
            this.prisma.employee.findMany({
                where,
                orderBy: [{ fullName: 'asc' }],
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { designation: true, department: true, campus: true },
            }),
        ]);
        return {
            items: rows.map((r) => this.listRow(r, true)),
            total,
            page,
            pageSize,
            scope: scope.kind,
        };
    }
    listRow(r, withContact) {
        return {
            id: r.id,
            employeeCode: r.employeeCode,
            fullName: r.fullName,
            title: r.title,
            gender: r.gender,
            staffType: r.staffType,
            status: r.status,
            employmentType: r.employmentType,
            designation: r.designation?.title ?? null,
            department: r.department?.name ?? null,
            departmentId: r.departmentId,
            campus: r.campus?.name ?? null,
            joiningDate: r.joiningDate,
            photoSeed: r.photoSeed,
            ...(withContact ? { phone: r.phone, officialEmail: r.officialEmail } : {}),
        };
    }
    async profile(code, user) {
        const emp = await this.prisma.employee.findUnique({
            where: { employeeCode: code },
            include: {
                designation: true,
                department: true,
                campus: true,
                qualifications: { orderBy: { yearOfPassing: 'desc' } },
                experiences: { orderBy: { fromDate: 'desc' } },
                serviceEvents: { orderBy: { effectiveDate: 'desc' } },
                salaryStructure: { include: { components: true } },
            },
        });
        if (!emp)
            throw new envelope_1.NotFoundError(`Employee ${code} not found`);
        const scope = (0, scope_1.scopeFor)(user, 'employees:read_all', 'employees:read_dept', 'employees:read_self');
        const isSelf = emp.id === user.employeeId;
        const inDept = scope.kind === 'DEPT' && emp.departmentId && scope.departmentIds.includes(emp.departmentId);
        const full = scope.kind === 'ALL' || isSelf || inDept;
        const year = new Date().getFullYear();
        let stats = null;
        let leaveBalances = null;
        let latestPayslip = null;
        if (full) {
            const since = new Date(Date.now() - 90 * 24 * 3600 * 1000);
            since.setUTCHours(0, 0, 0, 0);
            const [attend, leaveDays, balances, payslip] = await Promise.all([
                this.prisma.attendanceRecord.groupBy({
                    by: ['status'],
                    where: { employeeId: emp.id, date: { gte: since } },
                    _count: { _all: true },
                }),
                this.prisma.leaveApplication.aggregate({
                    where: { employeeId: emp.id, status: 'APPROVED', balanceYear: year },
                    _sum: { days: true },
                }),
                this.prisma.leaveBalance.findMany({
                    where: { employeeId: emp.id, year },
                    include: { leaveType: true },
                }),
                this.prisma.payslip.findFirst({
                    where: { employeeId: emp.id, status: { in: ['RELEASED', 'PAID'] } },
                    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
                }),
            ]);
            const counts = Object.fromEntries(attend.map((a) => [a.status, a._count._all]));
            const presentish = (counts.PRESENT ?? 0) + (counts.HALF_DAY ?? 0) + (counts.OFFICIAL_DUTY ?? 0) + (counts.WFH ?? 0);
            const totalDays = attend.reduce((s, a) => s + a._count._all, 0);
            stats = {
                attendanceRate90d: totalDays ? Math.round((presentish / totalDays) * 100) : 100,
                leaveUsedYear: leaveDays._sum.days ?? 0,
                serviceYears: Math.max(0, (Date.now() - new Date(emp.joiningDate).getTime()) / (365.25 * 24 * 3600 * 1000)),
            };
            leaveBalances = balances.map((b) => ({
                type: b.leaveType.name,
                code: b.leaveType.code,
                entitled: b.entitled + b.carriedForward,
                used: b.usedDays,
                pending: b.pendingDays,
                available: b.entitled + b.carriedForward - b.usedDays,
            }));
            latestPayslip = payslip
                ? { payslipNo: payslip.payslipNo, periodMonth: payslip.periodMonth, periodYear: payslip.periodYear, netPay: payslip.netPay, status: payslip.status }
                : null;
        }
        const docSummary = full
            ? await this.prisma.employeeDocument.findMany({
                where: { employeeId: emp.id },
                include: { category: true },
                orderBy: { uploadedAt: 'desc' },
            })
            : [];
        return {
            employee: {
                id: emp.id,
                employeeCode: emp.employeeCode,
                title: emp.title,
                fullName: emp.fullName,
                gender: emp.gender,
                staffType: emp.staffType,
                employmentType: emp.employmentType,
                status: emp.status,
                designation: emp.designation?.title ?? null,
                department: emp.department?.name ?? null,
                departmentId: emp.departmentId,
                campus: emp.campus?.name ?? null,
                campusId: emp.campusId,
                joiningDate: emp.joiningDate,
                probationEndDate: emp.probationEndDate,
                confirmationDate: emp.confirmationDate,
                separationDate: emp.separationDate,
                separationType: emp.separationType,
                photoSeed: emp.photoSeed,
                ...(full
                    ? {
                        dateOfBirth: emp.dateOfBirth,
                        bloodGroup: emp.bloodGroup,
                        maritalStatus: emp.maritalStatus,
                        reservationCategory: emp.reservationCategory,
                        personalEmail: emp.personalEmail,
                        officialEmail: emp.officialEmail,
                        phone: emp.phone,
                        alternatePhone: emp.alternatePhone,
                        addressLine: emp.addressLine,
                        city: emp.city,
                        state: emp.state,
                        pincode: emp.pincode,
                        emergencyContactName: emp.emergencyContactName,
                        emergencyContactPhone: emp.emergencyContactPhone,
                    }
                    : {}),
            },
            qualifications: emp.qualifications.map((q) => ({
                degree: q.degree,
                field: q.field,
                institutionName: q.institutionName,
                university: q.university,
                yearOfPassing: q.yearOfPassing,
                percentage: q.percentage,
                mode: q.mode,
            })),
            experiences: full
                ? emp.experiences.map((e) => ({
                    organisation: e.organisation,
                    designationTitle: e.designationTitle,
                    fromDate: e.fromDate,
                    toDate: e.toDate,
                    monthlySalary: e.monthlySalary,
                }))
                : [],
            serviceEvents: emp.serviceEvents.map((s) => ({
                eventType: s.eventType,
                effectiveDate: s.effectiveDate,
                referenceNo: s.referenceNo,
                details: s.details,
                remarks: s.remarks,
            })),
            salaryStructure: full && emp.salaryStructure
                ? {
                    effectiveFrom: emp.salaryStructure.effectiveFrom,
                    basicMonthly: emp.salaryStructure.basicMonthly,
                    hraPercent: emp.salaryStructure.hraPercent,
                    daPercent: emp.salaryStructure.daPercent,
                    components: emp.salaryStructure.components.map((c) => ({
                        code: c.code, name: c.name, kind: c.kind, calcType: c.calcType, value: c.value,
                    })),
                }
                : null,
            documents: docSummary.map((d) => ({
                id: d.id,
                title: d.title,
                category: d.category.name,
                accessLevel: d.accessLevel,
                expiresOn: d.expiresOn,
                isVerified: d.isVerified,
                sizeKb: d.sizeKb,
                uploadedAt: d.uploadedAt,
            })),
            stats,
            leaveBalances,
            latestPayslip,
            visibility: full ? 'full' : 'limited',
        };
    }
    async nextEmployeeCode() {
        const rows = await this.prisma.$queryRawUnsafe('SELECT COALESCE(MAX(CAST(SUBSTRING("employeeCode" FROM 5) AS INTEGER)), 1000) + 1 AS next FROM "Employee"');
        return `EMP-${rows[0]?.next ?? 1001}`;
    }
    async create(dto, user) {
        const designation = await this.prisma.designation.findUnique({ where: { id: dto.designationId } });
        if (!designation)
            throw new envelope_1.BadRequestError('Unknown designation');
        if (designation.category !== dto.staffType) {
            throw new envelope_1.BadRequestError(`Designation ${designation.title} belongs to ${designation.category} staff`);
        }
        const code = await this.nextEmployeeCode();
        const title = dto.gender === 'FEMALE' ? (dto.staffType === 'TEACHING' ? 'Dr./Prof.' : 'Ms./Mrs.') : dto.staffType === 'TEACHING' ? 'Dr./Prof.' : 'Mr.';
        const fullName = `${dto.firstName} ${dto.lastName}`;
        const joining = new Date(dto.joiningDate);
        const emailLocal = `${dto.firstName.toLowerCase()}.${dto.lastName.toLowerCase()}${code.slice(-2)}`;
        const officialEmail = `${emailLocal}@${EMAIL_DOMAIN}`;
        const probationEndDate = dto.employmentType === 'PERMANENT' ? new Date(joining.getTime() + 365 * 24 * 3600 * 1000) : null;
        const emp = await this.prisma.employee.create({
            data: {
                employeeCode: code,
                institutionId: user.institutionId,
                campusId: dto.campusId,
                departmentId: dto.departmentId ?? null,
                designationId: dto.designationId,
                staffType: dto.staffType,
                employmentType: dto.employmentType,
                status: dto.employmentType === 'PERMANENT' ? 'PROBATION' : 'ACTIVE',
                title,
                firstName: dto.firstName,
                lastName: dto.lastName,
                fullName,
                gender: dto.gender,
                dateOfBirth: new Date(dto.dateOfBirth),
                bloodGroup: dto.bloodGroup ?? null,
                maritalStatus: dto.maritalStatus ?? null,
                reservationCategory: dto.reservationCategory ?? null,
                personalEmail: dto.personalEmail,
                officialEmail,
                phone: dto.phone,
                alternatePhone: dto.alternatePhone ?? null,
                addressLine: dto.addressLine,
                city: dto.city,
                state: dto.state,
                pincode: dto.pincode,
                joiningDate: joining,
                probationEndDate,
                photoSeed: Math.floor(Math.random() * 1000),
                serviceEvents: {
                    create: { eventType: 'JOINING', effectiveDate: joining, details: `Joined as ${designation.title}`, referenceNo: `JOIN-${code}` },
                },
                ...(dto.qualifications?.length
                    ? {
                        qualifications: {
                            create: dto.qualifications.map((q) => ({
                                degree: q.degree,
                                field: q.field,
                                institutionName: q.institutionName,
                                university: q.university,
                                yearOfPassing: q.yearOfPassing,
                                percentage: q.percentage ?? null,
                                mode: q.mode ?? 'Full-time',
                            })),
                        },
                    }
                    : {}),
            },
        });
        if (dto.basicMonthly) {
            await this.prisma.salaryStructure.create({
                data: {
                    employeeId: emp.id,
                    effectiveFrom: joining,
                    basicMonthly: dto.basicMonthly,
                    components: {
                        create: [
                            { code: 'BASIC', name: 'Basic Pay', kind: 'EARNING', calcType: 'FIXED', value: dto.basicMonthly },
                            { code: 'DA', name: 'Dearness Allowance', kind: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 125 },
                            { code: 'HRA', name: 'House Rent Allowance', kind: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 30 },
                        ],
                    },
                },
            });
        }
        if (dto.createAccount !== false) {
            const { hash } = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
            await this.prisma.user.create({
                data: {
                    email: officialEmail,
                    employeeId: emp.id,
                    passwordHash: await hash('Welcome@2026', 10),
                    isDemo: false,
                    userRoles: {
                        create: {
                            roleId: (await this.prisma.role.findUnique({ where: { key: dto.staffType === 'TEACHING' ? 'FACULTY' : dto.staffType === 'TECHNICAL' ? 'TECHNICAL_STAFF' : 'NON_TEACHING_STAFF' } })).id,
                        },
                    },
                },
            });
        }
        await this.audit.record({
            userId: user.userId,
            actorEmail: user.email,
            action: 'EMPLOYEE_CREATED',
            module: 'employees',
            entityType: 'Employee',
            entityId: emp.id,
            summary: `${emp.fullName} (${emp.employeeCode}) joined as ${designation.title}`,
        });
        return { employeeCode: emp.employeeCode, id: emp.id };
    }
    async update(code, dto, user) {
        const emp = await this.prisma.employee.findUnique({ where: { employeeCode: code } });
        if (!emp)
            throw new envelope_1.NotFoundError(`Employee ${code} not found`);
        const data = {};
        if (dto.firstName || dto.lastName) {
            const firstName = dto.firstName ?? emp.firstName;
            const lastName = dto.lastName ?? emp.lastName;
            data.firstName = firstName;
            data.lastName = lastName;
            data.fullName = `${firstName} ${lastName}`;
        }
        for (const k of ['bloodGroup', 'personalEmail', 'phone', 'alternatePhone', 'addressLine', 'city', 'state', 'pincode', 'emergencyContactName', 'emergencyContactPhone']) {
            const v = dto[k];
            if (v !== undefined)
                data[k] = v ?? null;
        }
        if (dto.departmentId !== undefined) {
            data.department = dto.departmentId ? { connect: { id: dto.departmentId } } : { disconnect: true };
            if (dto.departmentId && dto.departmentId !== emp.departmentId) {
                await this.prisma.serviceEvent.create({
                    data: { employeeId: emp.id, eventType: 'TRANSFER', effectiveDate: new Date(), details: 'Department transfer (record update)', referenceNo: `TRF-${emp.employeeCode}` },
                });
            }
        }
        if (dto.designationId) {
            data.designation = { connect: { id: dto.designationId } };
            const desig = await this.prisma.designation.findUnique({ where: { id: dto.designationId } });
            await this.prisma.serviceEvent.create({
                data: { employeeId: emp.id, eventType: 'PROMOTION', effectiveDate: new Date(), details: `Designation updated to ${desig?.title ?? dto.designationId}`, referenceNo: `PRM-${emp.employeeCode}` },
            });
        }
        if (dto.campusId)
            data.campus = { connect: { id: dto.campusId } };
        if (dto.employmentType)
            data.employmentType = dto.employmentType;
        const updated = await this.prisma.employee.update({ where: { id: emp.id }, data });
        await this.audit.record({
            userId: user.userId,
            actorEmail: user.email,
            action: 'EMPLOYEE_UPDATED',
            module: 'employees',
            entityType: 'Employee',
            entityId: emp.id,
            summary: `Updated profile of ${updated.fullName} (${code})`,
            detail: dto,
        });
        return { ok: true };
    }
    async separate(code, dto, user) {
        const emp = await this.prisma.employee.findUnique({ where: { employeeCode: code } });
        if (!emp)
            throw new envelope_1.NotFoundError(`Employee ${code} not found`);
        if (emp.status === 'SEPARATED')
            throw new envelope_1.BadRequestError('Employee is already separated');
        const separationDate = new Date(dto.separationDate);
        await this.prisma.employee.update({
            where: { id: emp.id },
            data: { status: 'SEPARATED', separationDate, separationType: dto.separationType, separationRemarks: dto.remarks ?? null },
        });
        await this.prisma.serviceEvent.create({
            data: {
                employeeId: emp.id,
                eventType: 'SEPARATION',
                effectiveDate: separationDate,
                details: `Separated (${dto.separationType})${dto.remarks ? ' — ' + dto.remarks : ''}`,
                referenceNo: `SEP-${emp.employeeCode}`,
            },
        });
        await this.prisma.user.updateMany({ where: { employeeId: emp.id }, data: { status: 'SUSPENDED' } });
        await this.audit.record({
            userId: user.userId,
            actorEmail: user.email,
            action: 'EMPLOYEE_SEPARATED',
            module: 'employees',
            entityType: 'Employee',
            entityId: emp.id,
            summary: `${emp.fullName} separated (${dto.separationType})`,
        });
        return { ok: true };
    }
    async formData(user) {
        const [campuses, departments, designations] = await Promise.all([
            this.prisma.campus.findMany({ where: { institutionId: user.institutionId }, orderBy: { name: 'asc' } }),
            this.prisma.department.findMany({
                where: { institutionId: user.institutionId, isActive: true },
                orderBy: { name: 'asc' },
                include: { campus: true },
            }),
            this.prisma.designation.findMany({ where: { institutionId: user.institutionId }, orderBy: [{ category: 'asc' }, { payLevel: 'desc' }] }),
        ]);
        return { campuses, departments, designations };
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map