import { getCurrentUser } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { parsePagination } from '../../utils/pagination.js';
import { asOptionalString } from '../../utils/query.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as orderService from './order.service.js';
import { createOrderSchema } from './order.validation.js';

/* ────────────────────────── Customer ────────────────────────── */

/** POST /api/v1/orders */
export const createOrder = asyncHandler(async (req, res) => {
  const customer = getCurrentUser(req);
  const payload = createOrderSchema.parse(req.body);
  const order = await orderService.createOrder(customer, payload);

  return sendResponse(res, {
    statusCode: 201,
    message: 'Order placed successfully. The restaurant will respond shortly.',
    data: order,
  });
});

/** GET /api/v1/orders/mine?status=&page=&limit= */
export const listCustomerOrders = asyncHandler(async (req, res) => {
  const customer = getCurrentUser(req);
  const result = await orderService.listCustomerOrders(customer.id, {
    ...parsePagination(req.query),
    status: asOptionalString(req.query.status),
  });

  return sendResponse(res, {
    message: 'Your orders fetched successfully',
    data: result.orders,
    meta: result.meta,
  });
});

/** PATCH /api/v1/orders/:id/cancel */
export const cancelOrder = asyncHandler(async (req, res) => {
  const customer = getCurrentUser(req);
  const order = await orderService.cancelOrder(String(req.params.id), customer);

  return sendResponse(res, { message: 'Order cancelled successfully', data: order });
});

/* ────────────────────────── Vendor ────────────────────────── */

/** GET /api/v1/orders/vendor?status=&page=&limit= */
export const listVendorOrders = asyncHandler(async (req, res) => {
  const vendor = getCurrentUser(req);
  const result = await orderService.listVendorOrders(vendor.id, {
    ...parsePagination(req.query),
    status: asOptionalString(req.query.status),
  });

  return sendResponse(res, {
    message: 'Customer orders fetched successfully',
    data: result.orders,
    meta: result.meta,
  });
});

/** PATCH /api/v1/orders/:id/accept */
export const acceptOrder = asyncHandler(async (req, res) => {
  const vendor = getCurrentUser(req);
  const order = await orderService.decideVendorOrder(String(req.params.id), vendor, 'accepted');

  return sendResponse(res, { message: 'Order accepted successfully', data: order });
});

/** PATCH /api/v1/orders/:id/reject */
export const rejectOrder = asyncHandler(async (req, res) => {
  const vendor = getCurrentUser(req);
  const order = await orderService.decideVendorOrder(String(req.params.id), vendor, 'rejected');

  return sendResponse(res, { message: 'Order rejected', data: order });
});
