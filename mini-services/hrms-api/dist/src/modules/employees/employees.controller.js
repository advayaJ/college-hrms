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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const employees_service_1 = require("./employees.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const envelope_1 = require("../../core/http/envelope");
let EmployeesController = class EmployeesController {
    service;
    constructor(service) {
        this.service = service;
    }
    async list(q, departmentId, campusId, staffType, status, page, pageSize, user) {
        return (0, envelope_1.ok)(await this.service.list({
            q,
            departmentId,
            campusId,
            staffType,
            status,
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
        }, user));
    }
    async formData(user) {
        return (0, envelope_1.ok)(await this.service.formData(user));
    }
    async profile(code, user) {
        return (0, envelope_1.ok)(await this.service.profile(code, user));
    }
    async create(dto, user) {
        return (0, envelope_1.ok)(await this.service.create(dto, user));
    }
    async update(code, dto, user) {
        return (0, envelope_1.ok)(await this.service.update(code, dto, user));
    }
    async separate(code, dto, user) {
        return (0, envelope_1.ok)(await this.service.separate(code, dto, user));
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.RequirePermissions)('employees:read_all', 'employees:read_dept', 'employees:read_self'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('departmentId')),
    __param(2, (0, common_1.Query)('campusId')),
    __param(3, (0, common_1.Query)('staffType')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('pageSize')),
    __param(7, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('form-data'),
    (0, decorators_1.RequirePermissions)('employees:read_all', 'employees:read_dept', 'employees:read_self'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "formData", null);
__decorate([
    (0, common_1.Get)(':code'),
    (0, decorators_1.RequirePermissions)('employees:read_all', 'employees:read_dept', 'employees:read_self'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "profile", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.RequirePermissions)('employees:create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateEmployeeDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':code'),
    (0, decorators_1.RequirePermissions)('employees:update'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateEmployeeDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':code/separate'),
    (0, decorators_1.RequirePermissions)('employees:separate'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SeparateEmployeeDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "separate", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, common_1.Controller)('employees'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map