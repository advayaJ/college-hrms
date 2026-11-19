"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const prisma_module_1 = require("../prisma/prisma.module");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_guard_1 = require("./auth/auth.guard");
const registry_service_1 = require("./rbac/registry.service");
const audit_service_1 = require("./audit/audit.service");
const approval_engine_service_1 = require("./approvals/approval-engine.service");
let CoreModule = class CoreModule {
};
exports.CoreModule = CoreModule;
exports.CoreModule = CoreModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'hrms-dev-secret',
                signOptions: { expiresIn: 604800 },
            }),
        ],
        providers: [
            prisma_service_1.PrismaService,
            registry_service_1.PermissionRegistry,
            audit_service_1.AuditService,
            approval_engine_service_1.ApprovalEngine,
            { provide: core_1.APP_GUARD, useClass: auth_guard_1.AuthGuard },
        ],
        exports: [prisma_service_1.PrismaService, jwt_1.JwtModule, registry_service_1.PermissionRegistry, audit_service_1.AuditService, approval_engine_service_1.ApprovalEngine],
    })
], CoreModule);
//# sourceMappingURL=core.module.js.map