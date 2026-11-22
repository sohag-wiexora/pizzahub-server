import { getCurrentUser } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as favoriteService from './favorite.service.js';

/** GET /api/v1/favorites */
export const listFavorites = asyncHandler(async (req, res) => {
  const user = getCurrentUser(req);

  const favoriteIds = await favoriteService.listFavoriteIds(user.id);

  return sendResponse(res, { message: 'Favorites fetched successfully', data: favoriteIds });
});

/** POST /api/v1/favorites/toggle */
export const toggleFavorite = asyncHandler(async (req, res) => {
  const user = getCurrentUser(req);

  const favoriteIds = await favoriteService.toggleFavorite(user.id, req.body.itemId);

  return sendResponse(res, {
    message: 'Favorite updated successfully',
    data: favoriteIds,
  });
});
