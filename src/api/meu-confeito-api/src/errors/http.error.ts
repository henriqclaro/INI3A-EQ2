import { AppError } from './app.error';
import type { AppErrorCode, AuthErrorCode } from './codes.error';

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

export class AuthError extends AppError {
  constructor(statusCode: 401 | 403, message: string, errorCode: AuthErrorCode) {
    super(statusCode, message, errorCode);
  }
}
