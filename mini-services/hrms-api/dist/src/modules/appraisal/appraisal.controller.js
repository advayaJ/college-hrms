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
exports.AppraisalController = void 0;
const common_1 = require("@nestjs/common");
const appraisal_service_1 = require("./appraisal.service");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const envelope_1 = require("../../core/http/envelope");
let AppraisalController = class AppraisalController {
    service;
    constructor(service) {
        this.service = service;
    }
    async cycles(user) {
        return (0, envelope_1.ok)(await this.service.cycles(user));
    }
    async self(user) {
        return (0, envelope_1.ok)(await this.service.selfView(user));
    }
    async team(cycleId, user) {
        return (0, envelope_1.ok)(await this.service.team(user, cycleId));
    }
    async summary(user) {
        return (0, envelope_1.ok)(await this.service.summary(user));
    }
    async createCycle(dto, user) {
        return (0, envelope_1.ok)(await this.service.createCycle(dto, user));
    }
    async activateCycle(id, user) {
        return (0, envelope_1.ok)(await this.service.activateCycle(id, user));
    }
    async createGoal(dto, user) {
        return (0, envelope_1.ok)(await this.service.createGoal(dto, user));
    }
    async goalProgress(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.updateGoalProgress(id, dto, user));
    }
    async submitSelf(dto, user) {
        return (0, envelope_1.ok)(await this.service.submitSelfAssessment(dto, user));
    }
    async submitReview(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.submitReview(id, dto, user));
    }
};
exports.AppraisalController = AppraisalController;
__decorate([
    (0, common_1.Get)('cycles'),
    (0, decorators_1.RequirePermissions)('appraisal:read_self', 'appraisal:read_dept', 'appraisal:read_all', 'appraisal:manage_cycles'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppraisalController.prototype, "cycles", null);
__decorate([
    (0, common_1.Get)('self'),
    (0, decorators_1.RequirePermissions)('appraisal:read_self'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppraisalController.prototype, "self", null);
__decorate([
    (0, common_1.Get)('team'),
    (0, decorators_1.RequirePermissions)('appraisal:read_dept', 'appraisal:read_all'),
    __param(0, (0, common_1.Query)('cycleId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppraisalController.prototype, "team", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, decorators_1.RequirePermissions)('appraisal:read_all', 'appraisal:finalize'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppraisalController.prototype, "summary", null);
__decorate([
    (0, common_1.Post)('cycles'),
    (0, decorators_1.RequirePermissions)('appraisal:manage_cycles'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [appraisal_service_1.CreateCycleDto, Object]),
    __metadata("design:returntype", Promise)
], AppraisalController.prototype, "createCycle", null);
__decorate([
    (0, common_1.Post)('cycles/:id/activate'),
    (0, decorators_1.RequirePermissions)('appraisal:manage_cycles'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppraisalController.prototype, "activateCycle", null);
__decorate([
    (0, common_1.Post)('goals'),
    (0, decorators_1.RequirePermissions)('appraisal:review', 'appraisal:manage_cycles'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [appraisal_service_1.CreateGoalDto, Object]),
    __metadata("design:returntype", Promise)
], AppraisalController.prototype, "createGoal", null);
__decorate([
    (0, common_1.Post)('goals/:id/progress'),
    (0, decorators_1.RequirePermissions)('appraisal:self_assess'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, appraisal_service_1.GoalProgressDto, Object]),
    __metadata("design:returntype", Promise)
], AppraisalController.prototype, "goalProgress", null);
__decorate([
    (0, common_1.Post)('self/submit'),
    (0, decorators_1.RequirePermissions)('appraisal:self_assess'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [appraisal_service_1.SelfAssessmentDto, Object]),
    __metadata("design:returntype", Promise)
], AppraisalController.prototype, "submitSelf", null);
__decorate([
    (0, common_1.Post)('reviews/:id/review'),
    (0, decorators_1.RequirePermissions)('appraisal:review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, appraisal_service_1.ReviewerReviewDto, Object]),
    __metadata("design:returntype", Promise)
], AppraisalController.prototype, "submitReview", null);
exports.AppraisalController = AppraisalController = __decorate([
    (0, common_1.Controller)('appraisal'),
    __metadata("design:paramtypes", [appraisal_service_1.AppraisalService])
], AppraisalController);
//# sourceMappingURL=appraisal.controller.js.map