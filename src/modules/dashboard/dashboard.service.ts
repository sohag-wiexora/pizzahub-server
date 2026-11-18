import type { PipelineStage } from 'mongoose';
import type { OrderStatus } from '../../constants/index.js';
import { MenuItem } from '../../models/menuItem.model.js';
import { Order } from '../../models/order.model.js';
import { Transaction } from '../../models/transaction.model.js';
import { User } from '../../models/user.model.js';
import { isPremiumActive } from '../../utils/premium.js';
import type { AuthUser } from '../../interfaces/auth.js';

const MONTHS_IN_CHART = 6;

interface MonthBucket {
  label: string;
  total: number;
}

interface AggregateRow {
  _id: { year: number; month: number };
  total: number;
}

/** Labelled buckets for the last N months, oldest first. */
const buildMonthBuckets = (): Array<{ start: Date; label: string }> => {
  const buckets = [];
  const cursor = new Date();
  cursor.setUTCDate(1);
  cursor.setUTCHours(0, 0, 0, 0);

  for (let i = 0; i < MONTHS_IN_CHART; i += 1) {
    buckets.unshift({
      start: new Date(cursor),
      label: cursor.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }

  return buckets;
};

/** Turns raw $group rows into a zero-filled series the frontend can chart directly. */
const toMonthlySeries = (rows: AggregateRow[]): MonthBucket[] => {
  const buckets = buildMonthBuckets();

  return buckets.map(({ start, label }) => {
    const next = new Date(start);
    next.setUTCMonth(next.getUTCMonth() + 1);

    const row = rows.find(
      (item) =>
        item._id.year === start.getUTCFullYear() && item._id.month === start.getUTCMonth() + 1,
    );

    return { label, total: row?.total ?? 0 };
  });
};

const monthlyCountPipeline = (match: Record<string, unknown>): PipelineStage[] =>
  [
    {
      $match: {
        ...match,
        createdAt: { $gte: buildMonthBuckets()[0].start },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total: { $sum: 1 },
      },
    },
  ] as PipelineStage[];

/** Runs a monthly count aggregation and normalises the raw rows. */
const runMonthlyCount = async (
  model: typeof Order | typeof User | typeof Transaction,
  match: Record<string, unknown>,
): Promise<AggregateRow[]> => {
  const rows = (await model.aggregate(monthlyCountPipeline(match))) as AggregateRow[];
  return rows;
};

/* ────────────────────────── Vendor ────────────────────────── */

export const getVendorOverview = async (vendor: AuthUser) => {
  const vendorId = vendor.id;

  const [totalMenuItems, activeMenuItems, pendingOrders, acceptedOrders, orderRows] =
    await Promise.all([
      MenuItem.countDocuments({ vendorId }),
      MenuItem.countDocuments({ vendorId, status: 'approved' }),
      Order.countDocuments({ vendorId, status: 'pending' }),
      Order.countDocuments({ vendorId, status: 'accepted' }),
      runMonthlyCount(Order, { vendorId }),
    ]);

  return {
    stats: { totalMenuItems, activeMenuItems, pendingOrders, acceptedOrders },
    subscription: {
      plan: vendor.subscriptionPlan,
      isPremiumActive: isPremiumActive(vendor),
      expiresAt: vendor.subscriptionExpiresAt,
    },
    salesOverview: toMonthlySeries(orderRows),
  };
};

/* ────────────────────────── Customer ────────────────────────── */

export const getCustomerOverview = async (customerId: string) => {
  const statusCount = async (status?: OrderStatus): Promise<number> =>
    Order.countDocuments(status ? { customerId, status } : { customerId });

  const [totalOrders, pendingOrders, acceptedOrders, rejectedOrders, cancelledOrders, orderRows] =
    await Promise.all([
      statusCount(),
      statusCount('pending'),
      statusCount('accepted'),
      statusCount('rejected'),
      statusCount('cancelled'),
      runMonthlyCount(Order, { customerId }),
    ]);

  return {
    stats: { totalOrders, pendingOrders, acceptedOrders, rejectedOrders, cancelledOrders },
    orderOverview: toMonthlySeries(orderRows),
  };
};

/* ────────────────────────── Admin ────────────────────────── */

export const getAdminOverview = async () => {
  const since = buildMonthBuckets()[0].start;

  const [
    totalUsers,
    totalVendors,
    totalCustomers,
    totalMenuItems,
    pendingMenuItems,
    totalTransactions,
    userRows,
    orderRows,
    revenueRows,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'vendor' }),
    User.countDocuments({ role: 'customer' }),
    MenuItem.countDocuments({}),
    MenuItem.countDocuments({ status: 'pending' }),
    Transaction.countDocuments({}),
    runMonthlyCount(User, {}),
    runMonthlyCount(Order, {}),
    Transaction.aggregate<AggregateRow>([
      { $match: { createdAt: { $gte: since }, status: 'paid' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  return {
    stats: {
      totalUsers,
      totalVendors,
      totalCustomers,
      totalMenuItems,
      pendingMenuItems,
      totalTransactions,
    },
    platformAnalytics: {
      usersPerMonth: toMonthlySeries(userRows),
      ordersPerMonth: toMonthlySeries(orderRows),
      revenuePerMonth: toMonthlySeries(revenueRows),
    },
  };
};
