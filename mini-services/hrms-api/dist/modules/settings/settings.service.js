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
exports.SettingsService = exports.UpdateRolePermissionsDto = exports.AssignRoleDto = exports.UpdateStageDto = exports.UpdateSettingDto = exports.UpdateInstitutionDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../core/audit/audit.service");
const registry_service_1 = require("../../core/rbac/registry.service");
const permissions_1 = require("../../core/rbac/permissions");
const envelope_1 = require("../../core/http/envelope");
class UpdateInstitutionDto {
    name;
    naacGrade;
    phone;
    email;
    website;
    addressLine;
}
exports.UpdateInstitutionDto = UpdateInstitutionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInstitutionDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInstitutionDto.prototype, "naacGrade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInstitutionDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInstitutionDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInstitutionDto.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInstitutionDto.prototype, "addressLine", void 0);
class UpdateSettingDto {
    key;
    value;
    category;
}
exports.UpdateSettingDto = UpdateSettingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSettingDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSettingDto.prototype, "category", void 0);
class UpdateStageDto {
    strategy;
    minApprovals;
    slaHours;
    name;
}
exports.UpdateStageDto = UpdateStageDto;
__decorate([
    (0, class_validator_1.IsIn)(['ANY', 'ALL', 'QUORUM']),
    __metadata("design:type", String)
], UpdateStageDto.prototype, "strategy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateStageDto.prototype, "minApprovals", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateStageDto.prototype, "slaHours", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStageDto.prototype, "name", void 0);
class AssignRoleDto {
    email;
    roleKey;
    departmentCode;
}
exports.AssignRoleDto = AssignRoleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "roleKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "departmentCode", void 0);
class UpdateRolePermissionsDto {
    roleKey;
    permissions;
}
exports.UpdateRolePermissionsDto = UpdateRolePermissionsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRolePermissionsDto.prototype, "roleKey", void 0);
const DEFAULT_SETTINGS = {
    'attendance.work_hours': { value: { start: '09:30', end: '17:30', grace: 10 }, category: 'ATTENDANCE', label: 'Working hours & grace' },
    'attendance.late_threshold': { value: { minutes: 20, markHalfDayAfter: 120 }, category: 'ATTENDANCE', label: 'Late arrival rules' },
    'payroll.da_percent': { value: 42, category: 'PAYROLL', label: 'Dearness allowance %' },
    'payroll.hra_percent': { value: 20, category: 'PAYROLL', label: 'HRA %' },
    'payroll.epf_employee_percent': { value: 12, category: 'PAYROLL', label: 'EPF employee share %' },
    'payroll.pt_threshold': { value: 25000, category: 'PAYROLL', label: 'Professional tax threshold' },
    'payroll.disclaimer': { value: 'Demonstration slabs only — verify statutory rates before production use.', category: 'PAYROLL', label: 'Payroll disclaimer' },
    'leave.max_pending_days': { value: 45, category: 'LEAVE', label: 'Auto-escalate pending leave after N days' },
    'notifications.document_expiry_days': { value: 30, category: 'NOTIFICATIONS', label: 'Document expiry lookahead' },
    'security.session_days': { value: 7, category: 'SECURITY', label: 'Session validity' },
    'security.password_policy': { value: 'Min 8 characters; demo accounts use Demo@2026', category: 'SECURITY', label: 'Password policy' },
    'general.email_domain': { value: 'aryavratt.edu.in', category: 'GENERAL', label: 'Official email domain' },
    'general.financial_year': { value: 'April–March', category: 'GENERAL', label: 'Financial year' },
};
let SettingsService = class SettingsService {
    prisma;
    audit;
    registry;
    constructor(prisma, audit, registry) {
        this.prisma = prisma;
        this.audit = audit;
        this.registry = registry;
    }
    async institution(user) {
        return this.prisma.institution.findUnique({ where: { id: user.institutionId }, include: { campuses: true } });
    }
    async updateInstitution(dto, user) {
        await this.prisma.institution.update({ where: { id: user.institutionId }, data: dto });
        await this.audit.record({ userId: user.userId, actorEmail: user.email, action: 'INSTITUTION_UPDATED', module: 'settings', summary: 'Institution profile updated' });
        return { ok: true };
    }
    async settings(user) {
        const rows = await this.prisma.institutionSetting.findMany({ where: { institutionId: user.institutionId } });
        const map = new Map(rows.map((r) => [r.key, r]));
        const keys = [...new Set([...Object.keys(DEFAULT_SETTINGS), ...rows.map((r) => r.key)])];
        return keys.map((key) => {
            const row = map.get(key);
            const def = DEFAULT_SETTINGS[key];
            return {
                key,
                value: row?.value ?? def?.value,
                category: row?.category ?? def?.category ?? 'GENERAL',
                label: def?.label ?? key,
                updatedAt: row?.updatedAt ?? null,
            };
        });
    }
    async updateSetting(dto, user) {
        const existing = await this.prisma.institutionSetting.findUnique({
            where: { institutionId_key: { institutionId: user.institutionId, key: dto.key } },
        });
        if (existing) {
            await this.prisma.institutionSetting.update({ where: { id: existing.id }, data: { value: dto.value, updatedByUserId: user.userId } });
        }
        else {
            await this.prisma.institutionSetting.create({
                data: { institutionId: user.institutionId, key: dto.key, value: dto.value, category: dto.category ?? 'GENERAL', updatedByUserId: user.userId },
            });
        }
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'SETTING_UPDATED', module: 'settings',
            entityType: 'InstitutionSetting', entityId: dto.key, summary: `Setting "${dto.key}" updated`,
        });
        return { ok: true };
    }
    async workflows(user) {
        const rows = await this.prisma.approvalWorkflow.findMany({
            where: { institutionId: user.institutionId },
            include: { stages: { orderBy: { seq: 'asc' }, include: { approverRole: true, approverUser: { select: { email: true, employee: { select: { fullName: true } } } } } } },
            orderBy: { createdAt: 'asc' },
        });
        return rows.map((w) => ({
            id: w.id,
            name: w.name,
            docType: w.docType,
            description: w.description,
            isActive: w.isActive,
            isDefault: w.isDefault,
            stages: w.stages.map((s) => ({
                id: s.id,
                seq: s.seq,
                name: s.name,
                approverType: s.approverType,
                approverRole: s.approverRole ? { key: s.approverRole.key, name: s.approverRole.name } : null,
                approverUser: s.approverUser ? { email: s.approverUser.email, name: s.approverUser.employee?.fullName } : null,
                strategy: s.strategy,
                minApprovals: s.minApprovals,
                slaHours: s.slaHours,
                isFinal: s.isFinal,
            })),
        }));
    }
    async updateStage(stageId, dto, user) {
        const stage = await this.prisma.approvalStage.findUnique({ where: { id: stageId }, include: { workflow: true } });
        if (!stage || stage.workflow.institutionId !== user.institutionId)
            throw new envelope_1.NotFoundError('Stage not found');
        await this.prisma.approvalStage.update({
            where: { id: stageId },
            data: {
                name: dto.name ?? stage.name,
                strategy: dto.strategy,
                minApprovals: dto.minApprovals ?? stage.minApprovals,
                slaHours: dto.slaHours ?? stage.slaHours,
            },
        });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'WORKFLOW_STAGE_UPDATED', module: 'settings',
            entityType: 'ApprovalStage', entityId: stageId,
            summary: `Stage "${dto.name ?? stage.name}" set to ${dto.strategy}${dto.minApprovals ? ` (min ${dto.minApprovals})` : ''}`,
        });
        return { ok: true };
    }
    async setWorkflowActive(workflowId, active, user) {
        const wf = await this.prisma.approvalWorkflow.findUnique({ where: { id: workflowId } });
        if (!wf || wf.institutionId !== user.institutionId)
            throw new envelope_1.NotFoundError('Workflow not found');
        await this.prisma.approvalWorkflow.update({ where: { id: workflowId }, data: { isActive: active } });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'WORKFLOW_UPDATED', module: 'settings',
            entityType: 'ApprovalWorkflow', entityId: workflowId, summary: `Workflow "${wf.name}" ${active ? 'activated' : 'deactivated'}`,
        });
        return { ok: true };
    }
    async users(user, q, page = 1) {
        const where = {};
        if (q) {
            where.OR = [
                { email: { contains: q, mode: 'insensitive' } },
                { employee: { fullName: { contains: q, mode: 'insensitive' } } },
                { employee: { employeeCode: { contains: q.toUpperCase() } } },
            ];
        }
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where,
                include: {
                    employee: { select: { employeeCode: true, fullName: true, photoSeed: true, designation: { select: { title: true } } } },
                    userRoles: { include: { role: true, department: true } },
                },
                orderBy: { email: 'asc' },
                skip: (page - 1) * 25,
                take: 25,
            }),
        ]);
        return {
            total, page,
            items: rows.map((u) => ({
                id: u.id,
                email: u.email,
                status: u.status,
                isDemo: u.isDemo,
                lastLoginAt: u.lastLoginAt,
                employee: u.employee,
                roles: u.userRoles.map((r) => ({ key: r.role.key, name: r.role.name, department: r.department?.name ?? null })),
            })),
        };
    }
    async assignRole(dto, user) {
        const target = await this.prisma.user.findUnique({ where: { email: dto.email }, include: { userRoles: true } });
        if (!target)
            throw new envelope_1.NotFoundError('User not found');
        const role = await this.prisma.role.findUnique({ where: { key: dto.roleKey } });
        if (!role)
            throw new envelope_1.NotFoundError('Role not found');
        let departmentId = null;
        if (dto.departmentCode) {
            const dept = await this.prisma.department.findUnique({ where: { code: dto.departmentCode } });
            if (!dept)
                throw new envelope_1.NotFoundError('Department not found');
            departmentId = dept.id;
        }
        const existing = target.userRoles.find((r) => r.roleId === role.id && (r.departmentId ?? null) === (departmentId ?? null));
        if (existing)
            throw new envelope_1.BadRequestError('User already holds this role assignment');
        await this.prisma.userRole.create({ data: { userId: target.id, roleId: role.id, departmentId } });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'ROLE_ASSIGNED', module: 'settings',
            entityType: 'User', entityId: target.id,
            summary: `Role ${role.key}${departmentId ? ` (dept-scoped)` : ''} assigned to ${dto.email}`,
        });
        this.registry.invalidate(role.key);
        return { ok: true };
    }
    async removeRole(userId, roleKey, user) {
        const ur = await this.prisma.userRole.findFirst({
            where: { userId, role: { key: roleKey } },
            include: { role: true },
        });
        if (!ur)
            throw new envelope_1.NotFoundError('Assignment not found');
        await this.prisma.userRole.delete({ where: { id: ur.id } });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'ROLE_REMOVED', module: 'settings',
            entityType: 'User', entityId: userId, summary: `Role ${roleKey} removed from user`,
        });
        this.registry.invalidate(roleKey);
        return { ok: true };
    }
    async setUserStatus(userId, status, user) {
        if (userId === user.userId)
            throw new envelope_1.BadRequestError('You cannot suspend your own account');
        await this.prisma.user.update({ where: { id: userId }, data: { status } });
        if (status === 'SUSPENDED') {
            await this.prisma.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
        }
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'USER_STATUS_CHANGED', module: 'settings',
            entityType: 'User', entityId: userId, summary: `User set to ${status}`,
        });
        return { ok: true };
    }
    async resetPassword(userId, user) {
        const { hash } = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
        const temp = `Hrms@${Math.random().toString(36).slice(2, 8)}`;
        await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await hash(temp, 10) } });
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'PASSWORD_RESET', module: 'settings',
            entityType: 'User', entityId: userId, summary: 'Password reset (temporary password issued)',
        });
        return { temporaryPassword: temp };
    }
    async roles(user) {
        const roles = await this.prisma.role.findMany({
            include: { _count: { select: { userRoles: true, permissions: true } }, permissions: { include: { permission: true } } },
            orderBy: { name: 'asc' },
        });
        const allPermissions = permissions_1.PERMISSIONS.map((p) => ({ key: p.key, module: p.module, action: p.action, description: p.description }));
        return {
            roles: roles.map((r) => ({
                key: r.key,
                name: r.name,
                description: r.description,
                isSystem: r.isSystem,
                scope: r.scope,
                userCount: r._count.userRoles,
                permissionCount: r._count.permissions,
                permissions: r.permissions.map((p) => p.permission.key),
            })),
            allPermissions,
            modules: permissions_1.MODULE_LABELS,
        };
    }
    async updateRolePermissions(dto, user) {
        const role = await this.prisma.role.findUnique({ where: { key: dto.roleKey } });
        if (!role)
            throw new envelope_1.NotFoundError('Role not found');
        const valid = new Set(permissions_1.PERMISSIONS.map((p) => p.key));
        const perms = [...new Set(dto.permissions)].filter((p) => valid.has(p));
        await this.prisma.permission.createMany({
            data: permissions_1.PERMISSIONS.map((p) => ({ key: p.key, module: p.module, action: p.action, description: p.description })),
            skipDuplicates: true,
        });
        const rows = perms.length ? await this.prisma.permission.findMany({ where: { key: { in: perms } } }) : [];
        await this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
        if (rows.length) {
            await this.prisma.rolePermission.createMany({
                data: rows.map((r) => ({ roleId: role.id, permissionId: r.id })),
                skipDuplicates: true,
            });
        }
        this.registry.invalidate(role.key);
        await this.audit.record({
            userId: user.userId, actorEmail: user.email, action: 'ROLE_PERMISSIONS_UPDATED', module: 'settings',
            entityType: 'Role', entityId: role.key, summary: `Role ${role.key} now grants ${perms.length} permissions`,
        });
        return { ok: true, permissionCount: perms.length };
    }
    async auditLog(user, module, q, page = 1) {
        const where = {};
        if (module)
            where.module = module;
        if (q) {
            where.OR = [
                { summary: { contains: q, mode: 'insensitive' } },
                { actorEmail: { contains: q, mode: 'insensitive' } },
                { action: { contains: q.toUpperCase() } },
            ];
        }
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.auditLog.count({ where }),
            this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * 30,
                take: 30,
            }),
        ]);
        return {
            total, page,
            items: rows.map((r) => ({
                id: r.id, action: r.action, module: r.module, summary: r.summary,
                actorEmail: r.actorEmail, entityType: r.entityType, entityId: r.entityId,
                createdAt: r.createdAt,
            })),
        };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, registry_service_1.PermissionRegistry])
], SettingsService);
//# sourceMappingURL=settings.service.js.map