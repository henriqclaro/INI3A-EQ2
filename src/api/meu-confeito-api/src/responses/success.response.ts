import type { Response } from 'express';

export class SuccessResponse {
  constructor(
    public readonly res: Response,
    public readonly statusCode: number = 200,
    public readonly data: any = null,
    public readonly message?: string,
  ) {}
  public send() {
    return this.res.status(this.statusCode).json({
      status: 'success',
      message: this.message,
      data: this.data,
    });
  }
}
