import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './order.controller.js';
import { createOrderSchema } from './order.validation.js';

const router = Router();

/* ── Customer routes ── */
router.post(
  '/',
  authenticate,
  requireRole('customer'),
  validateBody(createOrderSchema),
  controller.createOrder,
);
router.get('/mine', authenticate, requireRole('customer'), controller.listCustomerOrders);
router.patch('/:id/cancel', authenticate, requireRole('customer'), controller.cancelOrder);

/* ── Vendor routes ── */
router.get('/vendor', authenticate, requireRole('vendor'), controller.listVendorOrders);
router.patch('/:id/accept', authenticate, requireRole('vendor'), controller.acceptOrder);
router.patch('/:id/reject', authenticate, requireRole('vendor'), controller.rejectOrder);

export default router;
