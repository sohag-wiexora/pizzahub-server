import type { Request } from 'express';
import { getCurrentUser } from '../../middleware/auth.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as paymentService from './payment.service.js';

/** POST /api/v1/payments/checkout-session */

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const vendor = getCurrentUser(req);
  const session = await paymentService.createCheckoutSession(vendor);

  return sendResponse(res, {
    statusCode: 201,
    message: 'Stripe checkout session created. Redirect the vendor to the returned url.',
    data: session,
  });
});

/**
 * POST /api/v1/payments/webhook
 
 * Mounted with express.raw() before the global JSON parser so Stripe's
 * signature can be verified against the untouched request body.
 */

export const handleStripeWebhook = asyncHandler(async (req: Request, res) => {
  const header = req.headers['stripe-signature'];
  const signature = Array.isArray(header) ? header[0] : header;

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));

  const event = await paymentService.handleStripeWebhook(rawBody, signature);

  return sendResponse(res, { message: `Stripe event received: ${event.type}` });
});

/** GET /api/v1/payments/session-status/:sessionId */

export const getSessionStatus = asyncHandler(async (req, res) => {
  const vendor = getCurrentUser(req);
  const sessionId = String(req.params.sessionId ?? '');

  if (!sessionId) {
    throw new ApiError(400, 'Stripe session id is required.');
  }

  const status = await paymentService.getSessionStatus(vendor, sessionId);

  return sendResponse(res, { message: 'Payment session status fetched successfully', data: status });
});
