import type { AppErrorCode } from '../types/error.code';

export class AppError extends Error {
  private readonly status: string;

  constructor(
    protected readonly statusCode = 400,
    message: string,
    protected readonly errorCode: AppErrorCode,
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}
