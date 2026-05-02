import type { Response } from 'express';

export abstract class SuccessResponse {
  constructor(
    protected readonly res: Response,
    protected readonly statusCode: number,
    protected readonly data: any,
    protected readonly message?: string,
  ) {
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public send() {
    return this.res.status(this.statusCode).json({
      status: 'success',
      message: this.message,
      data: this.data,
    });
  }
}
