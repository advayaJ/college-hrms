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
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const decorators_1 = require("./decorators");
const auth_types_1 = require("./auth.types");
const registry_service_1 = require("../rbac/registry.service");
const envelope_1 = require("../http/envelope");
let AuthGuard = class AuthGuard {
    reflector;
    jwt;
    registry;
    constructor(reflector, jwt, registry) {
        this.reflector = reflector;
        this.jwt = jwt;
        this.registry = registry;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(decorators_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) ?? false;
        const req = context.switchToHttp().getRequest();
        const payload = this.safeReadToken(req);
        if (isPublic) {
            if (payload) {
                try {
                    req.user = await this.toSession(payload);
                }
                catch { }
            }
            return true;
        }
        if (!payload)
            throw new envelope_1.UnauthorizedError('Sign in required');
        const session = await this.toSession(payload);
        req.user = session;
        const required = this.reflector.getAllAndOverride(decorators_1.PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (required && required.length > 0) {
            const granted = session.permissions.some((p) => required.includes(p));
            if (!granted) {
                throw new envelope_1.ForbiddenError(`Your active role (${session.activeRoleKey}) does not permit this action`);
            }
        }
        return true;
    }
    safeReadToken(req) {
        try {
            const header = req.headers['authorization'];
            if (header && header.startsWith('Bearer ')) {
                return this.jwt.verify(header.slice(7));
            }
            const cookie = (req.cookies || {})[auth_types_1.AUTH_COOKIE];
            if (cookie)
                return this.jwt.verify(cookie);
        }
        catch {
            return null;
        }
        return null;
    }
    async toSession(p) {
        const permissions = await this.registry.permissionsForRoles([p.act]);
        const activeRole = p.roles.find((r) => r.key === p.act);
        return {
            userId: p.sub,
            email: p.email,
            employeeId: p.emp,
            employeeCode: p.empCode,
            institutionId: p.inst,
            name: p.name,
            roles: p.roles,
            activeRoleKey: p.act,
            activeDepartmentId: activeRole?.departmentId ?? p.dep ?? null,
            permissions,
            designationTitle: p.desig ?? null,
            departmentId: p.dept ?? null,
            campusId: p.campus ?? null,
        };
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService,
        registry_service_1.PermissionRegistry])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map