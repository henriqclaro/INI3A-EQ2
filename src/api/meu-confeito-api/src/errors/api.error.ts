export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode = 400, message: string) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Data conflict error.') {
    super(409, message);
  }
}
