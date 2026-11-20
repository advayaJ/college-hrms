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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const envelope_1 = require("../../core/http/envelope");
const DATE = /^\d{4}-\d{2}-\d{2}$/;
let AttendanceController = class AttendanceController {
    service;
    constructor(service) {
        this.service = service;
    }
    async overview(user) {
        return (0, envelope_1.ok)(await this.service.overview(user));
    }
    async day(date, departmentId, campusId, user) {
        if (!DATE.test(date))
            return (0, envelope_1.ok)({ error: 'date must be YYYY-MM-DD' });
        return (0, envelope_1.ok)(await this.service.dayView(date, departmentId, campusId, user));
    }
    async monthly(month, year, departmentId, user) {
        const now = new Date();
        return (0, envelope_1.ok)(await this.service.monthly(month ? Number(month) : now.getUTCMonth() + 1, year ? Number(year) : now.getUTCFullYear(), user, departmentId));
    }
    async self(from, to, user) {
        const toS = to ?? new Date().toISOString().slice(0, 10);
        const fromS = from ?? new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);
        return (0, envelope_1.ok)(await this.service.self(fromS, toS, user));
    }
    async manual(dto, user) {
        return (0, envelope_1.ok)(await this.service.manualEntry(dto, user));
    }
    async requestCorrection(dto, user) {
        return (0, envelope_1.ok)(await this.service.requestCorrection(dto, user));
    }
    async corrections(status, user) {
        return (0, envelope_1.ok)(await this.service.corrections(user, status));
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, decorators_1.RequirePermissions)('attendance:read_all', 'attendance:read_dept', 'attendance:read_self'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('day/:date'),
    (0, decorators_1.RequirePermissions)('attendance:read_all', 'attendance:read_dept', 'attendance:read_self'),
    __param(0, (0, common_1.Param)('date')),
    __param(1, (0, common_1.Query)('departmentId')),
    __param(2, (0, common_1.Query)('campusId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "day", null);
__decorate([
    (0, common_1.Get)('monthly'),
    (0, decorators_1.RequirePermissions)('attendance:read_all', 'attendance:read_dept', 'attendance:read_self'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('departmentId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "monthly", null);
__decorate([
    (0, common_1.Get)('self'),
    (0, decorators_1.RequirePermissions)('attendance:read_self'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "self", null);
__decorate([
    (0, common_1.Post)('manual'),
    (0, decorators_1.RequirePermissions)('attendance:mark_manual'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_service_1.ManualEntryDto, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "manual", null);
__decorate([
    (0, common_1.Post)('corrections'),
    (0, decorators_1.RequirePermissions)('attendance:request_correction'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_service_1.CorrectionDto, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "requestCorrection", null);
__decorate([
    (0, common_1.Get)('corrections'),
    (0, decorators_1.RequirePermissions)('attendance:read_all', 'attendance:read_dept', 'attendance:read_self'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "corrections", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map