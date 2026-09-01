export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details: unknown[];
  public readonly success: boolean;

  constructor(statusCode: number, message: string, details: unknown[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }
}
