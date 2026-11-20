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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const payroll_service_1 = require("./payroll.service");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const envelope_1 = require("../../core/http/envelope");
let PayrollController = class PayrollController {
    service;
    constructor(service) {
        this.service = service;
    }
    async runs(user) {
        return (0, envelope_1.ok)(await this.service.runs(user));
    }
    async runDetail(id, user) {
        return (0, envelope_1.ok)(await this.service.runDetail(id, user));
    }
    async byDepartment(id) {
        return (0, envelope_1.ok)(await this.service.payrollByDepartment(id));
    }
    async createRun(dto, user) {
        return (0, envelope_1.ok)(await this.service.createRun(dto, user));
    }
    async compute(id, user) {
        return (0, envelope_1.ok)(await this.service.computeRun(id, user));
    }
    async submit(id, user) {
        return (0, envelope_1.ok)(await this.service.submitRun(id, user));
    }
    async disburse(id, user) {
        return (0, envelope_1.ok)(await this.service.disburse(id, user));
    }
    async structures(user) {
        return (0, envelope_1.ok)(await this.service.structures(user));
    }
    async myStructure(user) {
        return (0, envelope_1.ok)(await this.service.myStructure(user));
    }
    async myPayslips(user) {
        return (0, envelope_1.ok)(await this.service.myPayslips(user));
    }
    async payslip(payslipNo, user) {
        return (0, envelope_1.ok)(await this.service.payslip(payslipNo, user));
    }
    async adjust(payslipNo, dto, user) {
        return (0, envelope_1.ok)(await this.service.adjustPayslip(payslipNo, dto, user));
    }
    async costTrend(user) {
        return (0, envelope_1.ok)(await this.service.costTrend(user));
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)('runs'),
    (0, decorators_1.RequirePermissions)('payroll:read_all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "runs", null);
__decorate([
    (0, common_1.Get)('runs/:id'),
    (0, decorators_1.RequirePermissions)('payroll:read_all'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "runDetail", null);
__decorate([
    (0, common_1.Get)('runs/:id/by-department'),
    (0, decorators_1.RequirePermissions)('payroll:read_reports', 'payroll:read_all'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "byDepartment", null);
__decorate([
    (0, common_1.Post)('runs'),
    (0, decorators_1.RequirePermissions)('payroll:process'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payroll_service_1.CreateRunDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "createRun", null);
__decorate([
    (0, common_1.Post)('runs/:id/compute'),
    (0, decorators_1.RequirePermissions)('payroll:process'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "compute", null);
__decorate([
    (0, common_1.Post)('runs/:id/submit'),
    (0, decorators_1.RequirePermissions)('payroll:process'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)('runs/:id/disburse'),
    (0, decorators_1.RequirePermissions)('payroll:approve', 'payroll:process'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "disburse", null);
__decorate([
    (0, common_1.Get)('structures'),
    (0, decorators_1.RequirePermissions)('payroll:read_all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "structures", null);
__decorate([
    (0, common_1.Get)('my-structure'),
    (0, decorators_1.RequirePermissions)('payroll:read_self'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "myStructure", null);
__decorate([
    (0, common_1.Get)('my-payslips'),
    (0, decorators_1.RequirePermissions)('payroll:read_self'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "myPayslips", null);
__decorate([
    (0, common_1.Get)('payslips/:payslipNo'),
    (0, decorators_1.RequirePermissions)('payroll:read_self', 'payroll:read_all'),
    __param(0, (0, common_1.Param)('payslipNo')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "payslip", null);
__decorate([
    (0, common_1.Post)('payslips/:payslipNo/adjust'),
    (0, decorators_1.RequirePermissions)('payroll:process'),
    __param(0, (0, common_1.Param)('payslipNo')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payroll_service_1.AdjustPayslipDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "adjust", null);
__decorate([
    (0, common_1.Get)('cost-trend'),
    (0, decorators_1.RequirePermissions)('payroll:read_reports', 'payroll:read_all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "costTrend", null);
exports.PayrollController = PayrollController = __decorate([
    (0, common_1.Controller)('payroll'),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map