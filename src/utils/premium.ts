import { FREE_PLAN_ACTIVE_ITEM_LIMIT } from '../constants/index.js';

interface SubscriptionInfo {
  subscriptionPlan: 'free' | 'premium';
  subscriptionExpiresAt: Date | null;
}

/**
 * Premium is considered active only while the plan is set to "premium"
 * and the subscription has not expired. Expired subscriptions fall back
 * to the Free plan automatically.
 */
export const isPremiumActive = (user: SubscriptionInfo): boolean => {
  if (user.subscriptionPlan !== 'premium') return false;
  if (!user.subscriptionExpiresAt) return true;

  return new Date(user.subscriptionExpiresAt).getTime() > Date.now();
};

export const FREE_PLAN_LIMIT_MESSAGE =
  `The Free plan allows up to ${FREE_PLAN_ACTIVE_ITEM_LIMIT} active menu items. ` +
  'Upgrade to Premium to publish unlimited items.';
