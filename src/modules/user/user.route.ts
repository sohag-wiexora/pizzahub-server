import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './user.controller.js';
import { updateProfileSchema } from './user.validation.js';

const router = Router();

/* ── Profile (any authenticated user) ── */

router.get('/me', authenticate, controller.getProfile);
router.patch('/me', authenticate, validateBody(updateProfileSchema), controller.updateProfile);

/* ── Admin user management ── */

router.get('/', authenticate, requireRole('admin'), controller.listUsersForAdmin);
router.get('/:id', authenticate, requireRole('admin'), controller.getUserDetailsForAdmin);
router.patch('/:id/block', authenticate, requireRole('admin'), controller.blockUser);
router.patch('/:id/unblock', authenticate, requireRole('admin'), controller.unblockUser);

export default router;
