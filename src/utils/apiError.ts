/**
 * Application level error with an HTTP status code.
 * Throw it anywhere inside async handlers and the global error
 * middleware will turn it into a clean JSON response.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;

    Error.captureStackTrace?.(this, ApiError);
  }
}
