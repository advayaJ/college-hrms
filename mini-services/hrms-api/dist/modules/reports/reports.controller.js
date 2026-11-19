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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const envelope_1 = require("../../core/http/envelope");
let ReportsController = class ReportsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async headcount(user) {
        return (0, envelope_1.ok)(await this.service.headcount(user));
    }
    async attendance(month, year, user) {
        const now = new Date();
        return (0, envelope_1.ok)(await this.service.attendanceReport(month ? Number(month) : now.getUTCMonth() + 1, year ? Number(year) : now.getUTCFullYear(), user));
    }
    async leave(year, user) {
        return (0, envelope_1.ok)(await this.service.leaveReport(year ? Number(year) : new Date().getFullYear(), user));
    }
    async payroll(year, user) {
        return (0, envelope_1.ok)(await this.service.payrollReport(year ? Number(year) : new Date().getFullYear(), user));
    }
    async directoryCsv(user, res) {
        await this.service.directoryCsv(user, res);
        return res;
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('headcount'),
    (0, decorators_1.RequirePermissions)('reports:read', 'reports:read_dept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "headcount", null);
__decorate([
    (0, common_1.Get)('attendance'),
    (0, decorators_1.RequirePermissions)('reports:read', 'reports:read_dept'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "attendance", null);
__decorate([
    (0, common_1.Get)('leave'),
    (0, decorators_1.RequirePermissions)('reports:read', 'reports:read_dept'),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "leave", null);
__decorate([
    (0, common_1.Get)('payroll'),
    (0, decorators_1.RequirePermissions)('payroll:read_reports'),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "payroll", null);
__decorate([
    (0, common_1.Get)('employee-directory.csv'),
    (0, decorators_1.RequirePermissions)('reports:export'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "directoryCsv", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map