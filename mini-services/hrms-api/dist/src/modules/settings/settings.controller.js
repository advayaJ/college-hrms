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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("./settings.service");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const envelope_1 = require("../../core/http/envelope");
let SettingsController = class SettingsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async institution(user) {
        return (0, envelope_1.ok)(await this.service.institution(user));
    }
    async updateInstitution(dto, user) {
        return (0, envelope_1.ok)(await this.service.updateInstitution(dto, user));
    }
    async settings(user) {
        return (0, envelope_1.ok)(await this.service.settings(user));
    }
    async updateSetting(dto, user) {
        return (0, envelope_1.ok)(await this.service.updateSetting(dto, user));
    }
    async workflows(user) {
        return (0, envelope_1.ok)(await this.service.workflows(user));
    }
    async updateStage(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.updateStage(id, dto, user));
    }
    async setWorkflowActive(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.setWorkflowActive(id, dto.active, user));
    }
    async users(q, page, user) {
        return (0, envelope_1.ok)(await this.service.users(user, q, page ? Number(page) : 1));
    }
    async assignRole(dto, user) {
        return (0, envelope_1.ok)(await this.service.assignRole(dto, user));
    }
    async removeRole(id, roleKey, user) {
        return (0, envelope_1.ok)(await this.service.removeRole(id, roleKey, user));
    }
    async setUserStatus(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.setUserStatus(id, dto.status, user));
    }
    async resetPassword(id, user) {
        return (0, envelope_1.ok)(await this.service.resetPassword(id, user));
    }
    async roles(user) {
        return (0, envelope_1.ok)(await this.service.roles(user));
    }
    async updateRolePermissions(dto, user) {
        return (0, envelope_1.ok)(await this.service.updateRolePermissions(dto, user));
    }
    async auditLog(module, q, page, user) {
        return (0, envelope_1.ok)(await this.service.auditLog(user, module, q, page ? Number(page) : 1));
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)('institution'),
    (0, decorators_1.RequirePermissions)('settings:read', 'settings:manage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "institution", null);
__decorate([
    (0, common_1.Put)('institution'),
    (0, decorators_1.RequirePermissions)('settings:manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_service_1.UpdateInstitutionDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateInstitution", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, decorators_1.RequirePermissions)('settings:read', 'settings:manage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "settings", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, decorators_1.RequirePermissions)('settings:manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_service_1.UpdateSettingDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateSetting", null);
__decorate([
    (0, common_1.Get)('workflows'),
    (0, decorators_1.RequirePermissions)('settings:read', 'settings:manage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "workflows", null);
__decorate([
    (0, common_1.Put)('workflows/stages/:id'),
    (0, decorators_1.RequirePermissions)('settings:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, settings_service_1.UpdateStageDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateStage", null);
__decorate([
    (0, common_1.Post)('workflows/:id/active'),
    (0, decorators_1.RequirePermissions)('settings:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setWorkflowActive", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, decorators_1.RequirePermissions)('settings:users_read', 'settings:users_manage'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "users", null);
__decorate([
    (0, common_1.Post)('users/assign-role'),
    (0, decorators_1.RequirePermissions)('settings:users_manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_service_1.AssignRoleDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Post)('users/:id/roles/:roleKey/remove'),
    (0, decorators_1.RequirePermissions)('settings:users_manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('roleKey')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "removeRole", null);
__decorate([
    (0, common_1.Post)('users/:id/status'),
    (0, decorators_1.RequirePermissions)('settings:users_manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setUserStatus", null);
__decorate([
    (0, common_1.Post)('users/:id/reset-password'),
    (0, decorators_1.RequirePermissions)('settings:users_manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, decorators_1.RequirePermissions)('settings:read', 'settings:roles_manage', 'settings:users_read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "roles", null);
__decorate([
    (0, common_1.Put)('roles/permissions'),
    (0, decorators_1.RequirePermissions)('settings:roles_manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_service_1.UpdateRolePermissionsDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateRolePermissions", null);
__decorate([
    (0, common_1.Get)('audit'),
    (0, decorators_1.RequirePermissions)('settings:audit_read'),
    __param(0, (0, common_1.Query)('module')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "auditLog", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map