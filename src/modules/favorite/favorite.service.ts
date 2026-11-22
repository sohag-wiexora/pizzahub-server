import mongoose from 'mongoose';
import { Favorite } from '../../models/favorite.model.js';
import { MenuItem } from '../../models/menuItem.model.js';
import { ApiError } from '../../utils/apiError.js';

const { isValidObjectId } = mongoose;

/** Returns the list of favorited item ids for a customer (unordered array). */
export const listFavoriteIds = async (userId: string): Promise<string[]> => {
  const favorites = await Favorite.find({ userId })
    .select('itemId')
    .sort({ createdAt: 1 });

  return favorites.map((favorite) => favorite.itemId.toString());
};

/**
 * Toggles a customer's favorite on/off. Returns the fresh list of
 * favorite item ids after the change.
 */
export const toggleFavorite = async (userId: string, itemId: string): Promise<string[]> => {
  if (!isValidObjectId(itemId)) {
    throw new ApiError(400, 'Invalid menu item id.');
  }

  const exists = await MenuItem.exists({ _id: itemId, status: 'approved' });
  if (!exists) {
    throw new ApiError(404, 'Menu item not found.');
  }

  const existing = await Favorite.findOne({ userId, itemId });

  if (existing) {
    await existing.deleteOne();
  } else {
    await Favorite.create({ userId, itemId });
  }

  return listFavoriteIds(userId);
};
