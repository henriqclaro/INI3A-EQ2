import type { AppErrorCode } from './codes.error';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly errorCode: AppErrorCode;

  constructor(statusCode = 400, message: string, errorCode: AppErrorCode) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}
