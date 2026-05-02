import type { AppErrorCode, AuthErrorCode } from '../types/error.code';
import { AppError } from './app.error';

export class DefaultAppError extends AppError {
  constructor(message: string, errorCode: AppErrorCode) {
    super(400, message, errorCode);
  }
}

export class AuthError extends AppError {
  constructor(message: string, errorCode: AuthErrorCode) {
    super(401, message, errorCode);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.', errorCode: AppErrorCode = 'RESOURCE_NOT_FOUND') {
    super(404, message, errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(
    message = 'Data conflict error.',
    errorCode: AppErrorCode = 'RESOURCE_ALREADY_EXISTS',
  ) {
    super(409, message, errorCode);
  }
}
