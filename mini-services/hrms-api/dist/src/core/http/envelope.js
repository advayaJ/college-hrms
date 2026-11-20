"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.HttpError = void 0;
exports.ok = ok;
const common_1 = require("@nestjs/common");
class HttpError extends common_1.HttpException {
    code;
    constructor(code, message, status, details) {
        super({ code, message, details }, status);
        this.code = code;
    }
}
exports.HttpError = HttpError;
class BadRequestError extends HttpError {
    constructor(message = 'Invalid request', details) {
        super('BAD_REQUEST', message, common_1.HttpStatus.BAD_REQUEST, details);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends HttpError {
    constructor(message = 'Authentication required') {
        super('UNAUTHORIZED', message, common_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends HttpError {
    constructor(message = 'You do not have permission to perform this action') {
        super('FORBIDDEN', message, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends HttpError {
    constructor(message = 'Resource not found') {
        super('NOT_FOUND', message, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends HttpError {
    constructor(message = 'Conflicting state', details) {
        super('CONFLICT', message, common_1.HttpStatus.CONFLICT, details);
    }
}
exports.ConflictError = ConflictError;
function ok(data, meta) {
    return { ok: true, data, ...(meta ? { meta } : {}) };
}
//# sourceMappingURL=envelope.js.map