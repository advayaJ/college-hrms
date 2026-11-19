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
exports.RecruitmentController = void 0;
const common_1 = require("@nestjs/common");
const recruitment_service_1 = require("./recruitment.service");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const envelope_1 = require("../../core/http/envelope");
let RecruitmentController = class RecruitmentController {
    service;
    constructor(service) {
        this.service = service;
    }
    async vacancies(status, q, user) {
        return (0, envelope_1.ok)(await this.service.vacancies(user, { status, q }));
    }
    async vacancyDetail(id, user) {
        return (0, envelope_1.ok)(await this.service.vacancyDetail(id, user));
    }
    async createVacancy(dto, user) {
        return (0, envelope_1.ok)(await this.service.createVacancy(dto, user));
    }
    async submitVacancy(id, user) {
        return (0, envelope_1.ok)(await this.service.submitVacancy(id, user));
    }
    async candidates(q, user) {
        return (0, envelope_1.ok)(await this.service.candidates(user, q));
    }
    async createCandidate(dto, user) {
        return (0, envelope_1.ok)(await this.service.createCandidate(dto, user));
    }
    async createApplication(dto, user) {
        return (0, envelope_1.ok)(await this.service.createApplication(dto.vacancyId, dto.candidateCode, user));
    }
    async shortlist(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.shortlist(id, dto.note, dto.rating, user));
    }
    async reject(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.rejectApplication(id, dto.reason, user));
    }
    async scheduleInterview(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.scheduleInterview(id, dto, user));
    }
    async feedback(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.recordFeedback(id, dto, user));
    }
    async offer(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.makeOffer(id, dto, user));
    }
    async offerResponse(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.offerResponse(id, dto.accepted, user));
    }
    async onboard(id, dto, user) {
        return (0, envelope_1.ok)(await this.service.onboard(id, dto, user));
    }
    async pipeline(user) {
        return (0, envelope_1.ok)(await this.service.pipeline(user));
    }
};
exports.RecruitmentController = RecruitmentController;
__decorate([
    (0, common_1.Get)('vacancies'),
    (0, decorators_1.RequirePermissions)('recruitment:read', 'recruitment:manage'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "vacancies", null);
__decorate([
    (0, common_1.Get)('vacancies/:id'),
    (0, decorators_1.RequirePermissions)('recruitment:read', 'recruitment:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "vacancyDetail", null);
__decorate([
    (0, common_1.Post)('vacancies'),
    (0, decorators_1.RequirePermissions)('recruitment:manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recruitment_service_1.CreateVacancyDto, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "createVacancy", null);
__decorate([
    (0, common_1.Post)('vacancies/:id/submit'),
    (0, decorators_1.RequirePermissions)('recruitment:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "submitVacancy", null);
__decorate([
    (0, common_1.Get)('candidates'),
    (0, decorators_1.RequirePermissions)('recruitment:manage', 'recruitment:shortlist'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "candidates", null);
__decorate([
    (0, common_1.Post)('candidates'),
    (0, decorators_1.RequirePermissions)('recruitment:manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recruitment_service_1.CreateCandidateDto, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "createCandidate", null);
__decorate([
    (0, common_1.Post)('applications'),
    (0, decorators_1.RequirePermissions)('recruitment:manage', 'recruitment:shortlist'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "createApplication", null);
__decorate([
    (0, common_1.Post)('applications/:id/shortlist'),
    (0, decorators_1.RequirePermissions)('recruitment:shortlist', 'recruitment:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "shortlist", null);
__decorate([
    (0, common_1.Post)('applications/:id/reject'),
    (0, decorators_1.RequirePermissions)('recruitment:shortlist', 'recruitment:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)('applications/:id/interviews'),
    (0, decorators_1.RequirePermissions)('recruitment:shortlist', 'recruitment:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, recruitment_service_1.ScheduleInterviewDto, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "scheduleInterview", null);
__decorate([
    (0, common_1.Post)('interviews/:id/feedback'),
    (0, decorators_1.RequirePermissions)('recruitment:shortlist', 'recruitment:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, recruitment_service_1.FeedbackDto, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "feedback", null);
__decorate([
    (0, common_1.Post)('applications/:id/offer'),
    (0, decorators_1.RequirePermissions)('recruitment:decide'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, recruitment_service_1.OfferDto, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "offer", null);
__decorate([
    (0, common_1.Post)('applications/:id/offer-response'),
    (0, decorators_1.RequirePermissions)('recruitment:decide'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "offerResponse", null);
__decorate([
    (0, common_1.Post)('applications/:id/onboard'),
    (0, decorators_1.RequirePermissions)('recruitment:decide'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, recruitment_service_1.OnboardDto, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "onboard", null);
__decorate([
    (0, common_1.Get)('pipeline'),
    (0, decorators_1.RequirePermissions)('recruitment:read', 'recruitment:manage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "pipeline", null);
exports.RecruitmentController = RecruitmentController = __decorate([
    (0, common_1.Controller)('recruitment'),
    __metadata("design:paramtypes", [recruitment_service_1.RecruitmentService])
], RecruitmentController);
//# sourceMappingURL=recruitment.controller.js.map