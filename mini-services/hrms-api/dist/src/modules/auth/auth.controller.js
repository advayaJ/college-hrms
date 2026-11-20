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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../core/auth/decorators");
const current_user_decorator_1 = require("../../core/auth/current-user.decorator");
const auth_types_1 = require("../../core/auth/auth.types");
const envelope_1 = require("../../core/http/envelope");
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    async login(dto, req, res) {
        const ip = (req.headers['x-forwarded-for']?.toString() || req.socket?.remoteAddress || '').slice(0, 60);
        const deviceLabel = (req.headers['user-agent'] || 'unknown device').toString().slice(0, 120);
        const { token, view } = await this.auth.login(dto.email, dto.password, ip, deviceLabel);
        res.cookie(auth_types_1.AUTH_COOKIE, token, this.auth.cookieOptions());
        return (0, envelope_1.ok)(view);
    }
    async logout(req, res, user) {
        const token = this.rawToken(req);
        await this.auth.logout(user?.userId ?? null, this.auth.decode(token)?.jti);
        res.clearCookie(auth_types_1.AUTH_COOKIE, { path: '/' });
        return (0, envelope_1.ok)({ signedOut: true });
    }
    async me(user, req) {
        const payload = this.auth.decode(this.rawToken(req));
        return (0, envelope_1.ok)(await this.auth.sessionView(user.userId, payload ?? undefined));
    }
    async switchRole(user, dto, req, res) {
        const { token: newToken, view } = await this.auth.switchRole(user.userId, dto.roleKey, this.rawToken(req), dto.departmentId ?? null);
        res.cookie(auth_types_1.AUTH_COOKIE, newToken, this.auth.cookieOptions());
        return (0, envelope_1.ok)(view);
    }
    async demoAccounts() {
        return (0, envelope_1.ok)(await this.auth.demoAccounts());
    }
    async sessions(user) {
        return (0, envelope_1.ok)(await this.auth.mySessions(user.userId));
    }
    async revokeSession(user, id) {
        return (0, envelope_1.ok)(await this.auth.revokeSession(user.userId, id));
    }
    async changePassword(user, dto) {
        return (0, envelope_1.ok)(await this.auth.changePassword(user.userId, dto.currentPassword, dto.newPassword));
    }
    rawToken(req) {
        const cookie = (req.cookies || {})[auth_types_1.AUTH_COOKIE];
        if (cookie)
            return cookie;
        const header = req.headers['authorization']?.toString() || '';
        return header.startsWith('Bearer ') ? header.slice(7) : '';
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('switch-role'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SwitchRoleDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "switchRole", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('demo-accounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "demoAccounts", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sessions", null);
__decorate([
    (0, common_1.Post)('sessions/:id/revoke'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeSession", null);
__decorate([
    (0, common_1.Post)('change-password'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map