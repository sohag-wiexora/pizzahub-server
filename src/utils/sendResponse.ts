import type { Response } from 'express';
import type { PaginationMeta } from './pagination.js';

interface ResponseOptions<T> {
  statusCode?: number;
  success?: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

/** Every API endpoint answers with the same predictable JSON shape. */
export const sendResponse = <T>(res: Response, options: ResponseOptions<T>): Response => {
  const { statusCode = 200, success = true, message, data, meta } = options;

  return res.status(statusCode).json({
    success,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  });
};
