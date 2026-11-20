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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionRegistry = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PermissionRegistry = class PermissionRegistry {
    prisma;
    cache = new Map();
    ttl = 30_000;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async permissionsForRole(roleKey) {
        const hit = this.cache.get(roleKey);
        if (hit && Date.now() - hit.at < this.ttl)
            return hit.perms;
        const role = await this.prisma.role.findUnique({
            where: { key: roleKey },
            include: { permissions: { include: { permission: true } } },
        });
        const perms = role ? role.permissions.map((rp) => rp.permission.key) : [];
        this.cache.set(roleKey, { perms, at: Date.now() });
        return perms;
    }
    async permissionsForRoles(roleKeys) {
        const lists = await Promise.all([...new Set(roleKeys)].map((k) => this.permissionsForRole(k)));
        return [...new Set(lists.flat())];
    }
    invalidate(roleKey) {
        if (roleKey)
            this.cache.delete(roleKey);
        else
            this.cache.clear();
    }
};
exports.PermissionRegistry = PermissionRegistry;
exports.PermissionRegistry = PermissionRegistry = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionRegistry);
//# sourceMappingURL=registry.service.js.map