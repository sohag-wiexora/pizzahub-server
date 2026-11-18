import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ApiError } from '../utils/apiError.js';

/**
 * Validates req.body with a zod schema. On success the parsed (and
 * coerced) data replaces req.body, on failure it throws a 400 with
 * a per-field detail list.
 */
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));

      return next(new ApiError(400, 'Validation failed. Please check the submitted data.', details));
    }

    req.body = result.data;
    next();
  };
