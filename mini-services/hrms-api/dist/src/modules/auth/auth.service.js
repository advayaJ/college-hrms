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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../../core/audit/audit.service");
const registry_service_1 = require("../../core/rbac/registry.service");
const envelope_1 = require("../../core/http/envelope");
let AuthService = class AuthService {
    prisma;
    jwt;
    registry;
    audit;
    constructor(prisma, jwt, registry, audit) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.registry = registry;
        this.audit = audit;
    }
    async login(email, password, ip, deviceLabel) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                employee: { include: { department: true, designation: true } },
                userRoles: { include: { role: true, department: true } },
            },
        });
        if (!user || !user.employee)
            throw new envelope_1.UnauthorizedError('Invalid email or password');
        if (user.status !== 'ACTIVE')
            throw new envelope_1.UnauthorizedError('Account is ' + user.status.toLowerCase());
        const { compare } = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
        const valid = await compare(password, user.passwordHash);
        if (!valid) {
            await this.prisma.user.update({ where: { id: user.id }, data: { failedAttempts: { increment: 1 } } });
            throw new envelope_1.UnauthorizedError('Invalid email or password');
        }
        const roles = user.userRoles.map((ur) => ({
            key: ur.role.key,
            departmentId: ur.departmentId,
        }));
        const priority = ['SUPER_ADMIN', 'PRINCIPAL', 'HR_ADMIN', 'ACCOUNTANT', 'HOD', 'FACULTY', 'NON_TEACHING_STAFF', 'TECHNICAL_STAFF'];
        const preferred = (() => {
            for (const p of priority) {
                const r = roles.find((x) => x.key === p);
                if (r)
                    return r;
            }
            return roles[0];
        })();
        const jti = crypto.randomUUID();
        const payload = {
            sub: user.id,
            emp: user.employee.id,
            empCode: user.employee.employeeCode,
            email: user.email,
            name: user.employee.fullName,
            inst: user.employee.institutionId,
            roles,
            act: preferred?.key ?? 'FACULTY',
            dep: preferred?.departmentId ?? null,
            desig: user.employee.designation?.title ?? null,
            dept: user.employee.departmentId,
            campus: user.employee.campusId,
            jti,
        };
        const token = this.jwt.sign(payload);
        const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
        await this.prisma.userSession.create({ data: { userId: user.id, jti, ip, deviceLabel, expiresAt } });
        await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), failedAttempts: 0 } });
        await this.audit.record({
            userId: user.id,
            actorEmail: user.email,
            action: 'LOGIN',
            module: 'auth',
            summary: `${user.employee.fullName} signed in`,
        });
        return { token, expiresAt, view: await this.sessionView(user.id, payload) };
    }
    async sessionView(userId, payload) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                employee: { include: { department: true, designation: true, institution: { include: { campuses: true } } } },
                userRoles: { include: { role: true, department: true } },
            },
        });
        if (!user || !user.employee)
            throw new envelope_1.UnauthorizedError('Session no longer valid');
        const activeRoleKey = payload?.act ?? (user.userRoles[0]?.role.key ?? 'FACULTY');
        const permissions = await this.registry.permissionsForRoles([activeRoleKey]);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.employee.fullName,
                employeeId: user.employee.id,
                employeeCode: user.employee.employeeCode,
                designationTitle: user.employee.designation?.title ?? null,
                departmentId: user.employee.departmentId,
                departmentName: user.employee.department?.name ?? null,
                campusId: user.employee.campusId,
                photoSeed: user.employee.photoSeed,
            },
            institution: {
                id: user.employee.institution.id,
                name: user.employee.institution.name,
                code: user.employee.institution.code,
                type: user.employee.institution.type,
            },
            campuses: user.employee.institution.campuses.map((c) => ({ id: c.id, name: c.name, code: c.code, isMain: c.isMain })),
            roles: user.userRoles
                .filter((ur, i, all) => all.findIndex((o) => o.role.key === ur.role.key && o.departmentId === ur.departmentId) === i)
                .map((ur) => ({
                key: ur.role.key,
                name: ur.role.name,
                departmentId: ur.departmentId,
                departmentName: ur.department?.name ?? null,
            })),
            activeRoleKey,
            activeDepartmentId: payload?.dep ?? null,
            permissions,
        };
    }
    async switchRole(userId, roleKey, currentTokenRaw, departmentId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { userRoles: { include: { role: true } } } });
        if (!user)
            throw new envelope_1.UnauthorizedError();
        const target = user.userRoles.find((ur) => ur.role.key === roleKey && (departmentId ? ur.departmentId === departmentId : true));
        if (!target) {
            const held = user.userRoles.some((ur) => ur.role.key === roleKey);
            throw new envelope_1.BadRequestError(held ? `Role ${roleKey} is not assigned to that department` : `You do not hold the role ${roleKey}`);
        }
        const emp = await this.prisma.employee.findUnique({
            where: { id: user.employeeId },
            include: { designation: true },
        });
        if (!emp)
            throw new envelope_1.UnauthorizedError();
        let old = null;
        if (currentTokenRaw) {
            try {
                old = this.jwt.decode(currentTokenRaw);
            }
            catch {
                old = null;
            }
        }
        const payload = {
            sub: user.id,
            emp: emp.id,
            empCode: emp.employeeCode,
            email: user.email,
            name: emp.fullName,
            inst: emp.institutionId,
            roles: user.userRoles.map((ur) => ({ key: ur.role.key, departmentId: ur.departmentId })),
            act: roleKey,
            dep: target.departmentId,
            desig: emp.designation?.title ?? null,
            dept: emp.departmentId,
            campus: emp.campusId,
            jti: old?.jti ?? crypto.randomUUID(),
        };
        const token = this.jwt.sign(payload);
        return { token, view: await this.sessionView(user.id, payload) };
    }
    async logout(userId, jti) {
        if (userId) {
            await this.audit.record({ userId, actorEmail: '', action: 'LOGOUT', module: 'auth', summary: 'Signed out' });
            if (jti) {
                await this.prisma.userSession.updateMany({ where: { jti }, data: { revokedAt: new Date() } });
            }
        }
        return { ok: true };
    }
    async demoAccounts() {
        const users = await this.prisma.user.findMany({
            where: { isDemo: true },
            include: { employee: { include: { designation: true, department: true } }, userRoles: { include: { role: true } } },
            orderBy: { email: 'asc' },
        });
        const priority = ['SUPER_ADMIN', 'PRINCIPAL', 'HR_ADMIN', 'HOD', 'ACCOUNTANT', 'FACULTY', 'NON_TEACHING_STAFF', 'TECHNICAL_STAFF'];
        return users.map((u) => {
            const roles = [...u.userRoles].sort((a, b) => (priority.indexOf(a.role.key) + 99) - (priority.indexOf(b.role.key) + 99));
            const primary = roles[0]?.role ?? u.userRoles[0]?.role;
            return {
                email: u.email,
                name: u.employee.fullName,
                roleKey: primary?.key ?? '',
                roleName: primary?.name ?? '',
                designation: u.employee.designation?.title ?? null,
                departmentName: u.employee.department?.name ?? null,
                photoSeed: u.employee.photoSeed,
            };
        });
    }
    async mySessions(userId) {
        const rows = await this.prisma.userSession.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        return rows.map((s) => ({
            id: s.id,
            deviceLabel: s.deviceLabel,
            ip: s.ip,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            revokedAt: s.revokedAt,
        }));
    }
    async revokeSession(userId, sessionId) {
        const row = await this.prisma.userSession.findUnique({ where: { id: sessionId } });
        if (!row || row.userId !== userId)
            throw new envelope_1.NotFoundError('Session not found');
        await this.prisma.userSession.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
        return { ok: true };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new envelope_1.UnauthorizedError();
        const { compare, hash } = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
        if (!(await compare(currentPassword, user.passwordHash))) {
            throw new envelope_1.BadRequestError('Current password is incorrect');
        }
        const passwordHash = await hash(newPassword, 10);
        await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        return { ok: true };
    }
    cookieOptions(maxAgeMs = 7 * 24 * 3600 * 1000) {
        return { httpOnly: true, sameSite: 'lax', path: '/', maxAge: maxAgeMs };
    }
    decode(token) {
        if (!token)
            return null;
        try {
            return this.jwt.decode(token) ?? null;
        }
        catch {
            return null;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        registry_service_1.PermissionRegistry,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map