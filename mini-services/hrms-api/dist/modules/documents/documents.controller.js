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
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const documents_service_1 = require("./documents.service");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const envelope_1 = require("../../core/http/envelope");
let DocumentsController = class DocumentsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async list(q, categoryId, employeeCode, expiringInDays, page, user) {
        return (0, envelope_1.ok)(await this.service.list(user, {
            q, categoryId, employeeCode,
            expiringInDays: expiringInDays ? Number(expiringInDays) : undefined,
            page: page ? Number(page) : undefined,
        }));
    }
    async categories(user) {
        return (0, envelope_1.ok)(await this.service.categories(user));
    }
    async expiring(days, user) {
        return (0, envelope_1.ok)(await this.service.expiring(days ? Number(days) : 30, user));
    }
    async notifyExpiring(days, user) {
        return (0, envelope_1.ok)(await this.service.notifyExpiring(days ? Number(days) : 30, user));
    }
    async upload(dto, user) {
        return (0, envelope_1.ok)(await this.service.upload(dto, user));
    }
    async verify(id, user) {
        return (0, envelope_1.ok)(await this.service.verify(id, user));
    }
    async download(id, user, res) {
        await this.service.download(id, user, res);
        return res;
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.RequirePermissions)('documents:read_all', 'documents:read_dept', 'documents:read_self'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('employeeCode')),
    __param(3, (0, common_1.Query)('expiringInDays')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, decorators_1.RequirePermissions)('documents:read_all', 'documents:read_dept', 'documents:read_self'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "categories", null);
__decorate([
    (0, common_1.Get)('expiring'),
    (0, decorators_1.RequirePermissions)('documents:read_all', 'documents:read_dept', 'documents:read_self'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "expiring", null);
__decorate([
    (0, common_1.Post)('expiring/notify'),
    (0, decorators_1.RequirePermissions)('documents:verify', 'settings:manage'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "notifyExpiring", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.RequirePermissions)('documents:upload'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [documents_service_1.UploadDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)(':id/verify'),
    (0, decorators_1.RequirePermissions)('documents:verify'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)(':id/download'),
    (0, decorators_1.RequirePermissions)('documents:read_all', 'documents:read_dept', 'documents:read_self'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "download", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, common_1.Controller)('documents'),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map