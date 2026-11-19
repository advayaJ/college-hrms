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
exports.ApprovalsController = void 0;
const common_1 = require("@nestjs/common");
const approvals_service_1 = require("./approvals.service");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const envelope_1 = require("../../core/http/envelope");
let ApprovalsController = class ApprovalsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async pending(user) {
        return (0, envelope_1.ok)(await this.service.pending(user));
    }
    async history(mine, user) {
        return (0, envelope_1.ok)(await this.service.history(user, mine === '1'));
    }
    async detail(id, user) {
        return (0, envelope_1.ok)(await this.service.detail(id, user));
    }
    async decide(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.decide(id, dto, user));
    }
    async resubmit(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.resubmit(id, dto, user));
    }
};
exports.ApprovalsController = ApprovalsController;
__decorate([
    (0, common_1.Get)('pending'),
    (0, decorators_1.RequirePermissions)('dashboard:view'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "pending", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, decorators_1.RequirePermissions)('dashboard:view'),
    __param(0, (0, common_1.Query)('mine')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "history", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.RequirePermissions)('dashboard:view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(':id/decide'),
    (0, decorators_1.RequirePermissions)('dashboard:view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approvals_service_1.DecideDto, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "decide", null);
__decorate([
    (0, common_1.Post)(':id/resubmit'),
    (0, decorators_1.RequirePermissions)('dashboard:view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approvals_service_1.ResubmitDto, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "resubmit", null);
exports.ApprovalsController = ApprovalsController = __decorate([
    (0, common_1.Controller)('approvals'),
    __metadata("design:paramtypes", [approvals_service_1.ApprovalsService])
], ApprovalsController);
//# sourceMappingURL=approvals.controller.js.map