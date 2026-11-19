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
exports.WorkloadController = void 0;
const common_1 = require("@nestjs/common");
const workload_service_1 = require("./workload.service");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const envelope_1 = require("../../core/http/envelope");
let WorkloadController = class WorkloadController {
    service;
    constructor(service) {
        this.service = service;
    }
    async terms(user) {
        return (0, envelope_1.ok)(await this.service.terms(user));
    }
    async overview(termId, departmentId, user) {
        return (0, envelope_1.ok)(await this.service.overview(user, termId, departmentId));
    }
    async self(user) {
        return (0, envelope_1.ok)(await this.service.selfView(user));
    }
    async createSubject(dto, user) {
        return (0, envelope_1.ok)(await this.service.createSubject(dto, user));
    }
    async reassign(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.reassignSubject(id, dto.employeeCode, user));
    }
    async recompute(dto, user) {
        return (0, envelope_1.ok)(await this.service.recompute(dto.termId, dto.departmentId, user));
    }
};
exports.WorkloadController = WorkloadController;
__decorate([
    (0, common_1.Get)('terms'),
    (0, decorators_1.RequirePermissions)('workload:read_self', 'workload:read_dept', 'workload:read_all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkloadController.prototype, "terms", null);
__decorate([
    (0, common_1.Get)('overview'),
    (0, decorators_1.RequirePermissions)('workload:read_all', 'workload:read_dept', 'workload:read_self'),
    __param(0, (0, common_1.Query)('termId')),
    __param(1, (0, common_1.Query)('departmentId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WorkloadController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('self'),
    (0, decorators_1.RequirePermissions)('workload:read_self'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkloadController.prototype, "self", null);
__decorate([
    (0, common_1.Post)('subjects'),
    (0, decorators_1.RequirePermissions)('workload:manage_allocations'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workload_service_1.CreateSubjectDto, Object]),
    __metadata("design:returntype", Promise)
], WorkloadController.prototype, "createSubject", null);
__decorate([
    (0, common_1.Post)('subjects/:id/reassign'),
    (0, decorators_1.RequirePermissions)('workload:manage_allocations'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkloadController.prototype, "reassign", null);
__decorate([
    (0, common_1.Post)('recompute'),
    (0, decorators_1.RequirePermissions)('workload:manage_allocations'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkloadController.prototype, "recompute", null);
exports.WorkloadController = WorkloadController = __decorate([
    (0, common_1.Controller)('workload'),
    __metadata("design:paramtypes", [workload_service_1.WorkloadService])
], WorkloadController);
//# sourceMappingURL=workload.controller.js.map