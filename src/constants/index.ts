/** Pizza categories shown on the storefront and used for menu item filtering. */
export const PIZZA_CATEGORIES = [
  'Classic Pizzas',
  'Vegetarian Pizzas',
  'Meat Lovers',
  'Specialty / Gourmet Pizzas',
  'Sides & Appetizers',
  'Beverages & Desserts',
] as const;

export type PizzaCategory = (typeof PIZZA_CATEGORIES)[number];

export const USER_ROLES = ['admin', 'vendor', 'customer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MENU_ITEM_STATUSES = ['pending', 'approved', 'rejected', 'inactive'] as const;
export type MenuItemStatus = (typeof MENU_ITEM_STATUSES)[number];

/** Statuses a vendor may switch between on their own (availability management). */
export const VENDOR_MANAGEABLE_STATUSES = ['approved', 'inactive'] as const;

export const ORDER_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Orders in these statuses block a duplicate order for the same item + delivery date. */
export const ACTIVE_ORDER_STATUSES = ['pending', 'accepted'] as const;

export const SUBSCRIPTION_PLANS = ['free', 'premium'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

/** Maximum number of active (approved) menu items a vendor can have on the Free plan. */
export const FREE_PLAN_ACTIVE_ITEM_LIMIT = 3;

/** Days a Premium subscription stays valid after a successful payment. */
export const PREMIUM_PERIOD_DAYS = 31;
