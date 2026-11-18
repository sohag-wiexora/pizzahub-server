import { getCurrentUser } from '../../middleware/auth.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { parsePagination } from '../../utils/pagination.js';
import { asOptionalNumber, asOptionalString } from '../../utils/query.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { MENU_ITEM_STATUSES, type MenuItemStatus } from '../../constants/index.js';
import * as menuItemService from './menuItem.service.js';
import { createMenuItemSchema, updateMenuItemSchema } from './menuItem.validation.js';

/* ────────────────────────── Public ────────────────────────── */

/** GET /api/v1/menu-items?search=&category=&location=&minPrice=&maxPrice=&sort=&page=&limit= */
export const listPublicItems = asyncHandler(async (req, res) => {
  const result = await menuItemService.listPublicItems({
    ...parsePagination(req.query),
    search: asOptionalString(req.query.search),
    category: asOptionalString(req.query.category),
    location: asOptionalString(req.query.location),
    minPrice: asOptionalNumber(req.query.minPrice),
    maxPrice: asOptionalNumber(req.query.maxPrice),
    sort: asOptionalString(req.query.sort) ?? 'newest',
  });

  return sendResponse(res, {
    message: 'Menu items fetched successfully',
    data: result.items,
    meta: result.meta,
  });
});

/** GET /api/v1/menu-items/featured?limit=6 */
export const listFeaturedItems = asyncHandler(async (req, res) => {
  const limit = asOptionalNumber(req.query.limit) ?? 6;
  const items = await menuItemService.listFeaturedItems(limit);

  return sendResponse(res, { message: 'Featured menu items fetched successfully', data: items });
});

/** GET /api/v1/menu-items/categories */
export const listCategoryCounts = asyncHandler(async (_req, res) => {
  const categories = await menuItemService.listCategoryCounts();

  return sendResponse(res, { message: 'Menu categories fetched successfully', data: categories });
});

/** GET /api/v1/menu-items/:id */
export const getPublicItemDetails = asyncHandler(async (req, res) => {
  const item = await menuItemService.getPublicItemDetails(String(req.params.id));

  return sendResponse(res, { message: 'Menu item details fetched successfully', data: item });
});

/* ────────────────────────── Vendor ────────────────────────── */

/** POST /api/v1/menu-items */
export const createMenuItem = asyncHandler(async (req, res) => {
  const vendor = getCurrentUser(req);
  const payload = createMenuItemSchema.parse(req.body);
  const item = await menuItemService.createMenuItem(vendor, payload);

  return sendResponse(res, {
    statusCode: 201,
    message: 'Menu item created successfully. It will be visible to customers after admin approval.',
    data: item,
  });
});

/** GET /api/v1/menu-items/mine?status=&page=&limit= */
export const listVendorItems = asyncHandler(async (req, res) => {
  const vendor = getCurrentUser(req);
  const result = await menuItemService.listVendorItems(vendor.id, {
    ...parsePagination(req.query),
    status: asOptionalString(req.query.status),
  });

  return sendResponse(res, {
    message: 'Your menu items fetched successfully',
    data: result.items,
    meta: result.meta,
  });
});

/** GET /api/v1/menu-items/mine/:id */
export const getVendorItemDetails = asyncHandler(async (req, res) => {
  const vendor = getCurrentUser(req);
  const item = await menuItemService.getVendorItemDetails(String(req.params.id), vendor.id);

  return sendResponse(res, { message: 'Menu item details fetched successfully', data: item });
});

/** PATCH /api/v1/menu-items/:id */
export const updateMenuItem = asyncHandler(async (req, res) => {
  const vendor = getCurrentUser(req);
  const payload = updateMenuItemSchema.parse(req.body);
  const item = await menuItemService.updateMenuItem(String(req.params.id), vendor, payload);

  return sendResponse(res, { message: 'Menu item updated successfully', data: item });
});

/** DELETE /api/v1/menu-items/:id */
export const deleteMenuItem = asyncHandler(async (req, res) => {
  const vendor = getCurrentUser(req);
  const item = await menuItemService.deleteMenuItem(String(req.params.id), vendor.id);

  return sendResponse(res, { message: 'Menu item deleted successfully', data: item });
});

/* ────────────────────────── Admin ────────────────────────── */

/** GET /api/v1/menu-items/admin?search=&status=&category=&page=&limit= */
export const listAllItemsForAdmin = asyncHandler(async (req, res) => {
  const result = await menuItemService.listAllItemsForAdmin({
    ...parsePagination(req.query),
    search: asOptionalString(req.query.search),
    status: asOptionalString(req.query.status),
    category: asOptionalString(req.query.category),
  });

  return sendResponse(res, {
    message: 'All menu items fetched successfully',
    data: result.items,
    meta: result.meta,
  });
});

/** PATCH /api/v1/menu-items/admin/:id/status */
export const moderateItemStatus = asyncHandler(async (req, res) => {
  const status = asOptionalString(req.body?.status);

  if (!status || !(MENU_ITEM_STATUSES as readonly string[]).includes(status)) {
    throw new ApiError(400, `Status must be one of: ${MENU_ITEM_STATUSES.join(', ')}.`);
  }

  const item = await menuItemService.moderateItemStatus(String(req.params.id), status as MenuItemStatus);

  return sendResponse(res, { message: `Menu item marked as ${status}`, data: item });
});

/** DELETE /api/v1/menu-items/admin/:id */
export const deleteItemAsAdmin = asyncHandler(async (req, res) => {
  const item = await menuItemService.deleteItemAsAdmin(String(req.params.id));

  return sendResponse(res, { message: 'Menu item deleted successfully', data: item });
});
