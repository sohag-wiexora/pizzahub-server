import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '../../constants/index.js';
import { Transaction } from '../../models/transaction.model.js';
import type { Pagination } from '../../utils/pagination.js';
import { buildMeta } from '../../utils/pagination.js';

export interface TransactionListOptions extends Pagination {
  status?: string;
  plan?: string;
}

/**
 * Admin transaction history. Read-only by design — admins must never be
 * able to edit or delete payment records, so there are no write endpoints.
 */
export const listTransactions = async (options: TransactionListOptions) => {
  const { page, limit, skip, status, plan } = options;

  const filters: Record<string, unknown> = {};

  if (status && ['paid', 'pending', 'failed'].includes(status)) {
    filters.status = status;
  }
  if (plan && (SUBSCRIPTION_PLANS as readonly string[]).includes(plan)) {
    filters.plan = plan as SubscriptionPlan;
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filters)
      .populate('vendorId', 'name email businessName image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filters),
  ]);

  return { transactions, meta: buildMeta(total, { page, limit }) };
};
