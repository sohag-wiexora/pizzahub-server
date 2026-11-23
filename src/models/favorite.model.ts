import mongoose, { type Document, type Model, type Types } from 'mongoose';

const { model, models, Schema } = mongoose;

export interface FavoriteDocument extends Document {
  userId: string;
  itemId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<FavoriteDocument>(
  {
    userId: { type: String, required: true, ref: 'User', index: true },
    itemId: { type: Schema.Types.ObjectId, required: true, ref: 'MenuItem' },
  },
  {
    timestamps: true,
    collection: 'favorites',
  },
);

// A customer can favorite an item only once.

favoriteSchema.index({ userId: 1, itemId: 1 }, { unique: true });

export const Favorite =
  (models.Favorite as Model<FavoriteDocument>) || model<FavoriteDocument>('Favorite', favoriteSchema);
