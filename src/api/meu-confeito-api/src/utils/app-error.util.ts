export class AppError extends Error {
  public readonly status: number;

  constructor(status = 400, message: string) {
    super(message);
    this.status = status;
  }
}
