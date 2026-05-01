import type { Response } from 'express';

export abstract class SuccessResponse {
  constructor(
    protected readonly res: Response,
    protected readonly statusCode: number = 200,
    protected readonly data: any = null,
    protected readonly message?: string,
  ) {}
  public send() {
    return this.res.status(this.statusCode).json({
      status: 'success',
      message: this.message,
      data: this.data,
    });
  }
}
