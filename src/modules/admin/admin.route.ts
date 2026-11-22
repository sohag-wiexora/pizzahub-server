import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as orderController from '../order/order.controller.js';

const router = Router();

/* ── Admin order management ── */
router.get('/orders', authenticate, requireRole('admin'), orderController.listAllOrders);

export default router;
