import mongoose from 'mongoose';
import {
  FREE_PLAN_ACTIVE_ITEM_LIMIT,
  MENU_ITEM_STATUSES,
  PIZZA_CATEGORIES,
  type MenuItemStatus,
  type PizzaCategory,
} from '../../constants/index.js';
import { MenuItem, type MenuItemDocument } from '../../models/menuItem.model.js';
import { ApiError } from '../../utils/apiError.js';
import type { Pagination } from '../../utils/pagination.js';
import { buildMeta } from '../../utils/pagination.js';
import { escapeRegex } from '../../utils/query.js';
import { FREE_PLAN_LIMIT_MESSAGE, isPremiumActive } from '../../utils/premium.js';
import type { AuthUser } from '../../interfaces/auth.js';
import type { CreateMenuItemInput, UpdateMenuItemInput } from './menuItem.validation.js';

const { isValidObjectId } = mongoose;

/** Vendor fields exposed with every menu item (premium badge included). */
const VENDOR_FIELDS = 'name businessName image subscriptionPlan';

export interface PublicListOptions extends Pagination {
  search?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: string;
}

export interface OwnListOptions extends Pagination {
  status?: string;
}

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
};

/** Number of active (approved) items the vendor currently owns. */
const countActiveItems = (vendorId: string): Promise<number> =>
  MenuItem.countDocuments({ vendorId, status: 'approved' });

/**
 * Free plan vendors may publish up to 3 active items; premium is unlimited.
 * Used when creating an item and when re-activating an inactive one.
 */
const ensureActiveItemSlot = async (vendor: AuthUser): Promise<void> => {
  if (isPremiumActive(vendor)) return;

  const activeItems = await countActiveItems(vendor.id);
  if (activeItems >= FREE_PLAN_ACTIVE_ITEM_LIMIT) {
    throw new ApiError(403, FREE_PLAN_LIMIT_MESSAGE);
  }
};

const findOwnedItem = async (itemId: string, vendorId: string): Promise<MenuItemDocument> => {
  if (!isValidObjectId(itemId)) {
    throw new ApiError(400, 'Invalid menu item id.');
  }

  const item = await MenuItem.findOne({ _id: itemId, vendorId });
  if (!item) {
    throw new ApiError(404, 'Menu item not found or it does not belong to you.');
  }
  return item;
};

/* ────────────────────────── Public ────────────────────────── */

/** Public catalogue — only approved items are ever visible here. */
export const listPublicItems = async (options: PublicListOptions) => {
  const { page, limit, skip, search, category, location, minPrice, maxPrice, sort } = options;

  const filters: Record<string, unknown> = { status: 'approved' };

  if (search) {
    filters.itemName = { $regex: escapeRegex(search), $options: 'i' };
  }
  if (category && (PIZZA_CATEGORIES as readonly string[]).includes(category)) {
    filters.category = category as PizzaCategory;
  }
  if (location) {
    filters.location = { $regex: escapeRegex(location), $options: 'i' };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filters.price = {
      ...(minPrice !== undefined && { $gte: minPrice }),
      ...(maxPrice !== undefined && { $lte: maxPrice }),
    };
  }

  const sortStage = SORT_OPTIONS[sort] ?? SORT_OPTIONS.newest;

  const [items, total] = await Promise.all([
    MenuItem.find(filters)
      .populate('vendorId', VENDOR_FIELDS)
      .sort(sortStage)
      .skip(skip)
      .limit(limit),
    MenuItem.countDocuments(filters),
  ]);

  return { items, meta: buildMeta(total, { page, limit }) };
};

/**
 * Homepage featured section. Premium vendors get featured placement,
 * so their items are pushed to the front before the newest ones.
 */
export const listFeaturedItems = async (limit = 6) => {
  const featuredLimit = Math.min(12, Math.max(1, limit));

  return MenuItem.aggregate([
    { $match: { status: 'approved' } },
    // vendorId is stored as a string, while Better Auth user ids are
    // ObjectIds. `populate()` casts automatically, but `$lookup` does not —
    // so convert it explicitly or every featured item is silently dropped.
    {
      $addFields: {
        vendorObjectId: {
          $convert: { input: '$vendorId', to: 'objectId', onError: null, onNull: null },
        },
      },
    },
    { $lookup: { from: 'user', localField: 'vendorObjectId', foreignField: '_id', as: 'vendor' } },
    { $unwind: '$vendor' },
    {
      $addFields: {
        vendorIsPremium: { $cond: [{ $eq: ['$vendor.subscriptionPlan', 'premium'] }, 1, 0] },
      },
    },
    { $sort: { vendorIsPremium: -1, createdAt: -1 } },
    { $limit: featuredLimit },
    {
      $project: {
        itemName: 1,
        category: 1,
        description: 1,
        price: 1,
        location: 1,
        images: 1,
        status: 1,
        rating: 1,
        reviewCount: 1,
        createdAt: 1,
        vendor: {
          _id: '$vendor._id',
          name: '$vendor.name',
          businessName: '$vendor.businessName',
          image: '$vendor.image',
          subscriptionPlan: '$vendor.subscriptionPlan',
        },
      },
    },
  ]);
};

/** Category list with item counts, for the homepage categories section. */
export const listCategoryCounts = () =>
  MenuItem.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { _id: 0, category: '$_id', count: 1 } },
    { $sort: { category: 1 } },
  ]);

/** Public item details page. Rejected/pending items look like missing items. */
export const getPublicItemDetails = async (itemId: string) => {
  if (!isValidObjectId(itemId)) {
    throw new ApiError(400, 'Invalid menu item id.');
  }

  const item = await MenuItem.findOne({ _id: itemId, status: 'approved' }).populate(
    'vendorId',
    VENDOR_FIELDS,
  );

  if (!item) {
    throw new ApiError(
      404,
      'This menu item is not available. It may have been removed or is waiting for approval.',
    );
  }
  return item;
};

/* ────────────────────────── Vendor ────────────────────────── */

export const listVendorItems = async (vendorId: string, options: OwnListOptions) => {
  const { page, limit, skip, status } = options;

  const filters: Record<string, unknown> = { vendorId };
  if (status && (MENU_ITEM_STATUSES as readonly string[]).includes(status)) {
    filters.status = status as MenuItemStatus;
  }

  const [items, total] = await Promise.all([
    MenuItem.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    MenuItem.countDocuments(filters),
  ]);

  return { items, meta: buildMeta(total, { page, limit }) };
};

export const getVendorItemDetails = async (itemId: string, vendorId: string) => {
  const item = await findOwnedItem(itemId, vendorId);
  return item;
};

export const createMenuItem = async (vendor: AuthUser, payload: CreateMenuItemInput) => {
  await ensureActiveItemSlot(vendor);

  const item = await MenuItem.create({
    ...payload,
    vendorId: vendor.id,
    status: 'pending',
  });

  return item;
};

export const updateMenuItem = async (
  itemId: string,
  vendor: AuthUser,
  payload: UpdateMenuItemInput,
) => {
  const item = await findOwnedItem(itemId, vendor.id);
  const { status, ...updates } = payload;

  if (status && status !== item.status) {
    const deactivating = item.status === 'approved' && status === 'inactive';
    const reactivating = item.status === 'inactive' && status === 'approved';

    if (!deactivating && !reactivating) {
      throw new ApiError(
        400,
        'Only admin can approve or reject items. You can activate or deactivate your approved items.',
      );
    }
    if (reactivating) {
      await ensureActiveItemSlot(vendor);
    }
  }

  Object.assign(item, updates);
  if (status) item.status = status;

  return item.save();
};

export const deleteMenuItem = async (itemId: string, vendorId: string) => {
  if (!isValidObjectId(itemId)) {
    throw new ApiError(400, 'Invalid menu item id.');
  }

  const item = await MenuItem.findOneAndDelete({ _id: itemId, vendorId });
  if (!item) {
    throw new ApiError(404, 'Menu item not found or it does not belong to you.');
  }
  return item;
};

/* ────────────────────────── Admin ────────────────────────── */

export interface AdminListOptions extends Pagination {
  search?: string;
  status?: string;
  category?: string;
}

export const listAllItemsForAdmin = async (options: AdminListOptions) => {
  const { page, limit, skip, search, status, category } = options;

  const filters: Record<string, unknown> = {};

  if (search) {
    filters.itemName = { $regex: escapeRegex(search), $options: 'i' };
  }
  if (status && (MENU_ITEM_STATUSES as readonly string[]).includes(status)) {
    filters.status = status as MenuItemStatus;
  }
  if (category && (PIZZA_CATEGORIES as readonly string[]).includes(category)) {
    filters.category = category as PizzaCategory;
  }

  const [items, total] = await Promise.all([
    MenuItem.find(filters)
      .populate('vendorId', VENDOR_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    MenuItem.countDocuments(filters),
  ]);

  return { items, meta: buildMeta(total, { page, limit }) };
};

export const moderateItemStatus = async (itemId: string, status: MenuItemStatus) => {
  if (!isValidObjectId(itemId)) {
    throw new ApiError(400, 'Invalid menu item id.');
  }

  const item = await MenuItem.findByIdAndUpdate(
    itemId,
    { status },
    { returnDocument: 'after' },
  );
  if (!item) {
    throw new ApiError(404, 'Menu item not found.');
  }
  return item;
};

export const deleteItemAsAdmin = async (itemId: string) => {
  if (!isValidObjectId(itemId)) {
    throw new ApiError(400, 'Invalid menu item id.');
  }

  const item = await MenuItem.findByIdAndDelete(itemId);
  if (!item) {
    throw new ApiError(404, 'Menu item not found.');
  }
  return item;
};
