import type { AppErrorCode } from '../types/error.code';

export abstract class AppError extends Error {
  public readonly status: string;

  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errorCode: AppErrorCode,
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
