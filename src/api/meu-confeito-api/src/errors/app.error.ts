import { z } from 'zod';

export class AppError extends Error {
  public readonly status: number;

  constructor(status = 400, message: string) {
    super(message);
    this.status = status;
  }
}

export class ValidationError extends AppError {
  public readonly errors: any[];

  constructor(message: string, errors: any[]) {
    super(400, message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
