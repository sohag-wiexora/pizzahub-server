import { getCurrentUser } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as reviewService from './review.service.js';
import type { CreateReviewInput } from './review.validation.js';

/** GET /api/v1/menu-items/:id/reviews */

export const listItemReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.listItemReviews(String(req.params.id));

  return sendResponse(res, { message: 'Reviews fetched successfully', data: reviews });
});

/** POST /api/v1/menu-items/:id/reviews */

export const createReview = asyncHandler(async (req, res) => {
  const customer = getCurrentUser(req);
  const payload = req.body as CreateReviewInput;

  const review = await reviewService.createReview(String(req.params.id), customer, payload);

  return sendResponse(res,({
    statusCode: 201,
    message: 'Review published successfully',
    data: review,
  }));
});
