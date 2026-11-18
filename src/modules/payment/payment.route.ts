import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as controller from './payment.controller.js';

const router = Router();

// Note: the webhook is mounted with express.raw() in app.ts BEFORE the global
// JSON parser, because Stripe signature verification needs the raw body.
router.post('/webhook', controller.handleStripeWebhook);

router.post(
  '/checkout-session',
  authenticate,
  requireRole('vendor'),
  controller.createCheckoutSession,
);
router.get(
  '/session-status/:sessionId',
  authenticate,
  requireRole('vendor'),
  controller.getSessionStatus,
);

export default router;
