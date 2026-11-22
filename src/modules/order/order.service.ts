import mongoose, { type Types } from 'mongoose';
import { ACTIVE_ORDER_STATUSES, ORDER_STATUSES, type OrderStatus } from '../../constants/index.js';
import { MenuItem } from '../../models/menuItem.model.js';
import { Order, type OrderDocument } from '../../models/order.model.js';
import { ApiError } from '../../utils/apiError.js';
import type { Pagination } from '../../utils/pagination.js';
import { buildMeta } from '../../utils/pagination.js';
import type { AuthUser } from '../../interfaces/auth.js';
import type { CreateOrderInput } from './order.validation.js';

const { isValidObjectId } = mongoose;

const ITEM_FIELDS = 'itemName images price location';
const CUSTOMER_FIELDS = 'name email image';
const VENDOR_FIELDS = 'name businessName image';

const parseOrderId = (orderId: string): Types.ObjectId => {
  if (!isValidObjectId(orderId)) {
    throw new ApiError(400, 'Invalid order id.');
  }
  return orderId as unknown as Types.ObjectId;
};

const applyStatusFilter = (filters: Record<string, unknown>, status?: string): void => {
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    filters.status = status as OrderStatus;
  }
};

/* ────────────────────────── Customer ────────────────────────── */

export const createOrder = async (customer: AuthUser, payload: CreateOrderInput) => {
  const item = await MenuItem.findById(payload.itemId);
  if (!item) {
    throw new ApiError(404, 'Menu item not found.');
  }
  if (item.status !== 'approved') {
    throw new ApiError(400, 'This item is not available for ordering right now.');
  }
  if (item.vendorId === customer.id) {
    throw new ApiError(403, 'You cannot order your own menu item.');
  }

  const deliveryDate = new Date(`${payload.deliveryDate}T00:00:00.000Z`);
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  if (Number.isNaN(deliveryDate.getTime())) {
    throw new ApiError(400, 'Delivery date is invalid.');
  }
  if (deliveryDate < todayStart) {
    throw new ApiError(400, 'Delivery date cannot be in the past.');
  }

  // One active order per item per delivery date keeps the vendor queue clean.
  const duplicate = await Order.exists({
    customerId: customer.id,
    itemId: item._id,
    deliveryDate,
    status: { $in: [...ACTIVE_ORDER_STATUSES] },
  });
  if (duplicate) {
    throw new ApiError(
      400,
      'You already have an active order for this item on this delivery date.',
    );
  }

  const order = await Order.create({
    itemId: item._id,
    vendorId: item.vendorId,
    customerId: customer.id,
    deliveryDate,
    deliveryAddress: payload.deliveryAddress,
    message: payload.message ?? '',
  });

  return order.populate([
    { path: 'itemId', select: ITEM_FIELDS },
    { path: 'vendorId', select: VENDOR_FIELDS },
  ]);
};

export const listCustomerOrders = async (
  customerId: string,
  options: Pagination & { status?: string },
) => {
  const { page, limit, skip, status } = options;

  const filters: Record<string, unknown> = { customerId };
  applyStatusFilter(filters, status);

  const [orders, total] = await Promise.all([
    Order.find(filters)
      .populate([
        { path: 'itemId', select: ITEM_FIELDS },
        { path: 'vendorId', select: VENDOR_FIELDS },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filters),
  ]);

  return { orders, meta: buildMeta(total, { page, limit }) };
};

export const cancelOrder = async (orderId: string, customer: AuthUser) => {
  const order = await Order.findOne({ _id: parseOrderId(orderId), customerId: customer.id });
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }
  if (order.status !== 'pending') {
    throw new ApiError(
      400,
      `Only pending orders can be cancelled. This order is already ${order.status}.`,
    );
  }

  order.status = 'cancelled';
  await order.save();

  return order.populate([
    { path: 'itemId', select: ITEM_FIELDS },
    { path: 'vendorId', select: VENDOR_FIELDS },
  ]);
};

/* ────────────────────────── Admin ────────────────────────── */

/** Every order on the platform, newest first. Used by the admin dashboard. */
export const listAllOrders = async (options: { status?: string } = {}) => {
  const filters: Record<string, unknown> = {};
  applyStatusFilter(filters, options.status);

  return Order.find(filters)
    .populate([
      { path: 'itemId', select: ITEM_FIELDS },
      { path: 'vendorId', select: VENDOR_FIELDS },
      { path: 'customerId', select: CUSTOMER_FIELDS },
    ])
    .sort({ createdAt: -1 });
};

/* ────────────────────────── Admin ────────────────────────── */

/**
 * Platform-wide order feed for the admin dashboard. Populates the item, the
 * vendor and the customer so the client can render the same OrderCard it uses
 * for customer/vendor lists.
 */
export const listAllOrders = async (options: Pagination & { status?: string }) => {
  const { page, limit, skip, status } = options;

  const filters: Record<string, unknown> = {};
  applyStatusFilter(filters, status);

  const [orders, total] = await Promise.all([
    Order.find(filters)
      .populate([
        { path: 'itemId', select: ITEM_FIELDS },
        { path: 'vendorId', select: VENDOR_FIELDS },
        { path: 'customerId', select: CUSTOMER_FIELDS },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filters),
  ]);

  return { orders, meta: buildMeta(total, { page, limit }) };
};

/* ────────────────────────── Vendor ────────────────────────── */


export const listVendorOrders = async (vendorId: string, options: Pagination & { status?: string }) => {
  const { page, limit, skip, status } = options;

  const filters: Record<string, unknown> = { vendorId };
  applyStatusFilter(filters, status);

  const [orders, total] = await Promise.all([
    Order.find(filters)
      .populate([
        { path: 'itemId', select: ITEM_FIELDS },
        { path: 'customerId', select: CUSTOMER_FIELDS },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filters),
  ]);

  return { orders, meta: buildMeta(total, { page, limit }) };
};

/** Accepts or rejects a pending order. The decision can only be made once. */
export const decideVendorOrder = async (
  orderId: string,
  vendor: AuthUser,
  decision: Extract<OrderStatus, 'accepted' | 'rejected'>,
) => {
  const order: OrderDocument | null = await Order.findOne({
    _id: parseOrderId(orderId),
    vendorId: vendor.id,
  });

  if (!order) {
    throw new ApiError(404, 'Order not found or it does not belong to your restaurant.');
  }
  if (order.status !== 'pending') {
    throw new ApiError(
      400,
      `Only pending orders can be ${decision}. This order has already been ${order.status}.`,
    );
  }

  order.status = decision;
  await order.save();

  return order.populate([
    { path: 'itemId', select: ITEM_FIELDS },
    { path: 'customerId', select: CUSTOMER_FIELDS },
  ]);
};
