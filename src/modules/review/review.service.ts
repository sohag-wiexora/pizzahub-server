import mongoose, { type Types } from 'mongoose';
import { MenuItem } from '../../models/menuItem.model.js';
import { Review } from '../../models/review.model.js';
import { ApiError } from '../../utils/apiError.js';
import type { AuthUser } from '../../interfaces/auth.js';
import type { CreateReviewInput } from './review.validation.js';

const { isValidObjectId } = mongoose;

const parseItemId = (itemId: string): Types.ObjectId => {
  if (!isValidObjectId(itemId)) {
    throw new ApiError(400, 'Invalid menu item id.');
  }
  return itemId as unknown as Types.ObjectId;
};

/** All reviews for a menu item, newest first. */
export const listItemReviews = async (itemId: string) => {
  const id = parseItemId(itemId);

  return Review.find({ itemId: id }).sort({ createdAt: -1 });
};

/** Recalculates the menu item rating/reviewCount from all its reviews. */
const refreshItemRating = async (itemId: Types.ObjectId): Promise<void> => {
  const [stats] = await Review.aggregate<{
    _id: Types.ObjectId;
    rating: number;
    count: number;
  }>([
    { $match: { itemId } },
    { $group: { _id: '$itemId', rating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const rating = stats ? Math.round(stats.rating * 10) / 10 : 0;

  await MenuItem.updateOne(
    { _id: itemId },
    { $set: { rating, reviewCount: stats?.count ?? 0 } },
  );
};

/** Customer publishes a rating + comment for an approved menu item. */
export const createReview = async (
  itemId: string,
  customer: AuthUser,
  payload: CreateReviewInput,
) => {
  const id = parseItemId(itemId);

  const item = await MenuItem.findOne({ _id: id, status: 'approved' });
  if (!item) {
    throw new ApiError(404, 'Menu item not found.');
  }

  const review = await Review.create({
    itemId: id,
    customerId: customer.id,
    customerName: customer.name,
    customerImage: customer.image ?? null,
    rating: payload.rating,
    comment: payload.comment,
  });

  await refreshItemRating(id);

  return review;
};
