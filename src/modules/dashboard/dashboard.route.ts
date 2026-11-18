import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as controller from './dashboard.controller.js';

const router = Router();

router.get('/vendor', authenticate, requireRole('vendor'), controller.getVendorOverview);
router.get('/customer', authenticate, requireRole('customer'), controller.getCustomerOverview);
router.get('/admin', authenticate, requireRole('admin'), controller.getAdminOverview);

export default router;
