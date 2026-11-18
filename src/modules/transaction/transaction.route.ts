import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as controller from './transaction.controller.js';

const router = Router();

// Intentionally read-only: admins must not be able to edit payment records.
router.get('/', authenticate, requireRole('admin'), controller.listTransactions);

export default router;
