import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './menuItem.controller.js';
import { createMenuItemSchema, updateMenuItemSchema } from './menuItem.validation.js';

const router = Router();

/* ── Public routes (no authentication) ── */
router.get('/', controller.listPublicItems);
router.get('/featured', controller.listFeaturedItems);
router.get('/categories', controller.listCategoryCounts);

/* ── Vendor routes ── */
router.post(
  '/',
  authenticate,
  requireRole('vendor'),
  validateBody(createMenuItemSchema),
  controller.createMenuItem,
);
router.get('/mine', authenticate, requireRole('vendor'), controller.listVendorItems);
router.get('/mine/:id', authenticate, requireRole('vendor'), controller.getVendorItemDetails);
router.patch(
  '/:id',
  authenticate,
  requireRole('vendor'),
  validateBody(updateMenuItemSchema),
  controller.updateMenuItem,
);
router.delete('/:id', authenticate, requireRole('vendor'), controller.deleteMenuItem);

/* ── Admin routes ── */
router.get('/admin', authenticate, requireRole('admin'), controller.listAllItemsForAdmin);
router.patch(
  '/admin/:id/status',
  authenticate,
  requireRole('admin'),
  controller.moderateItemStatus,
);
router.delete('/admin/:id', authenticate, requireRole('admin'), controller.deleteItemAsAdmin);

/* ── Public item details (kept last so /:id does not swallow the paths above) ── */
router.get('/:id', controller.getPublicItemDetails);

export default router;
