import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './favorite.controller.js';
import { toggleFavoriteSchema } from './favorite.validation.js';

const router = Router();

/* ── Customer favorites ── */

router.get('/', authenticate, requireRole('customer'), controller.listFavorites);
router.post(
  '/toggle',
  authenticate,
  requireRole('customer'),
  validateBody(toggleFavoriteSchema),
  controller.toggleFavorite,
);

export default router;
