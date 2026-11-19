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
exports.LeaveController = void 0;
const common_1 = require("@nestjs/common");
const leave_service_1 = require("./leave.service");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const envelope_1 = require("../../core/http/envelope");
let LeaveController = class LeaveController {
    service;
    constructor(service) {
        this.service = service;
    }
    async types(user) {
        return (0, envelope_1.ok)(await this.service.types(user));
    }
    async balances(employeeCode, user) {
        return (0, envelope_1.ok)(await this.service.balances(user, employeeCode));
    }
    async applications(status, employeeCode, departmentId, mine, page, pageSize, user) {
        return (0, envelope_1.ok)(await this.service.applications(user, { status, employeeCode, departmentId, mine: mine === '1' }, page ? Number(page) : 1, Math.min(100, pageSize ? Number(pageSize) : 25)));
    }
    async myApplication(refNo, user) {
        return (0, envelope_1.ok)(await this.service.myApplication(refNo, user));
    }
    async calendar(month, year, user) {
        const now = new Date();
        return (0, envelope_1.ok)(await this.service.calendar(user, month ? Number(month) : now.getUTCMonth() + 1, year ? Number(year) : now.getUTCFullYear()));
    }
    async apply(dto, user) {
        return (0, envelope_1.ok)(await this.service.apply(dto, user));
    }
    async cancel(refNo, user) {
        return (0, envelope_1.ok)(await this.service.cancel(refNo, user));
    }
    async updateReturned(refNo, dto, user) {
        return (0, envelope_1.ok)(await this.service.updateReturned(refNo, dto, user));
    }
};
exports.LeaveController = LeaveController;
__decorate([
    (0, common_1.Get)('types'),
    (0, decorators_1.RequirePermissions)('leave:read_self', 'leave:read_dept', 'leave:read_all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "types", null);
__decorate([
    (0, common_1.Get)('balances'),
    (0, decorators_1.RequirePermissions)('leave:read_self', 'leave:read_dept', 'leave:read_all'),
    __param(0, (0, common_1.Query)('employeeCode')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "balances", null);
__decorate([
    (0, common_1.Get)('applications'),
    (0, decorators_1.RequirePermissions)('leave:read_self', 'leave:read_dept', 'leave:read_all'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('employeeCode')),
    __param(2, (0, common_1.Query)('departmentId')),
    __param(3, (0, common_1.Query)('mine')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('pageSize')),
    __param(6, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "applications", null);
__decorate([
    (0, common_1.Get)('applications/:refNo'),
    (0, decorators_1.RequirePermissions)('leave:read_self', 'leave:read_dept', 'leave:read_all'),
    __param(0, (0, common_1.Param)('refNo')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "myApplication", null);
__decorate([
    (0, common_1.Get)('calendar'),
    (0, decorators_1.RequirePermissions)('leave:read_self', 'leave:read_dept', 'leave:read_all'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "calendar", null);
__decorate([
    (0, common_1.Post)('apply'),
    (0, decorators_1.RequirePermissions)('leave:apply'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [leave_service_1.ApplyLeaveDto, Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "apply", null);
__decorate([
    (0, common_1.Post)('applications/:refNo/cancel'),
    (0, decorators_1.RequirePermissions)('leave:cancel'),
    __param(0, (0, common_1.Param)('refNo')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "cancel", null);
__decorate([
    (0, common_1.Put)('applications/:refNo'),
    (0, decorators_1.RequirePermissions)('leave:apply'),
    __param(0, (0, common_1.Param)('refNo')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, leave_service_1.UpdateLeaveApplicationDto, Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "updateReturned", null);
exports.LeaveController = LeaveController = __decorate([
    (0, common_1.Controller)('leave'),
    __metadata("design:paramtypes", [leave_service_1.LeaveService])
], LeaveController);
//# sourceMappingURL=leave.controller.js.map