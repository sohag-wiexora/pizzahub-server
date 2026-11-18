import type { ErrorRequestHandler, RequestHandler } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

interface MongooseLikeError {
  name?: string;
  message?: string;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

/** Fallback for requests that do not match any route. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/** Converts every thrown error into a consistent JSON error response. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const known = error as MongooseLikeError & { stack?: string };

  let statusCode = 500;
  let message = 'Something went wrong on our side. Please try again later.';
  let details: unknown;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (known.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier provided.';
  } else if (known.code === 11000) {
    statusCode = 400;
    const fields = Object.keys(known.keyValue ?? {}).join(', ');
    message = fields ? `Duplicate value for: ${fields}.` : 'Duplicate value detected.';
  } else if (known.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed. Please check the submitted data.';
    details = Object.entries(known.errors ?? {}).map(([field, err]) => ({
      field,
      message: err.message,
    }));
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Malformed JSON body.';
  }

  if (statusCode >= 500) {
    console.error('✗ Unhandled error:', known.message);
    if (known.stack) console.error(known.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined && { details }),
    ...(statusCode >= 500 && env.NODE_ENV !== 'production' && known.stack && { stack: known.stack }),
  });
};
