import { Router } from 'express';
import adminRoutes from './modules/admin/admin.route.js';
import dashboardRoutes from './modules/dashboard/dashboard.route.js';
import favoriteRoutes from './modules/favorite/favorite.route.js';
import menuItemRoutes from './modules/menuitem/menuItem.route.js';
import orderRoutes from './modules/order/order.route.js';
import paymentRoutes from './modules/payment/payment.route.js';
import transactionRoutes from './modules/transaction/transaction.route.js';
import uploadRoutes from './modules/upload/upload.route.js';
import userRoutes from './modules/user/user.route.js';

const router = Router();

router.use('/menu-items', menuItemRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/payments', paymentRoutes);
router.use('/transactions', transactionRoutes);
router.use('/uploads', uploadRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
