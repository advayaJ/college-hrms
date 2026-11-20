import { HttpException, HttpStatus } from '@nestjs/common'

export class HttpError extends HttpException {
  code: string
  constructor(code: string, message: string, status: HttpStatus, details?: unknown) {
    super({ code, message, details }, status)
    this.code = code
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Invalid request', details?: unknown) {
    super('BAD_REQUEST', message, HttpStatus.BAD_REQUEST, details)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'You do not have permission to perform this action') {
    super('FORBIDDEN', message, HttpStatus.FORBIDDEN)
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', message, HttpStatus.NOT_FOUND)
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflicting state', details?: unknown) {
    super('CONFLICT', message, HttpStatus.CONFLICT, details)
  }
}

// Standard success envelope
export function ok(data: unknown, meta?: Record<string, unknown>) {
  return { ok: true, data, ...(meta ? { meta } : {}) }
}
