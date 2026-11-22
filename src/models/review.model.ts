import mongoose, { type Document, type Model, type Types } from 'mongoose';

const { model, models, Schema } = mongoose;

export interface ReviewDocument extends Document {
  itemId: Types.ObjectId;
  customerId: string;
  customerName: string;
  customerImage: string | null;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    itemId: { type: Schema.Types.ObjectId, required: true, ref: 'MenuItem', index: true },
    customerId: { type: String, required: true, ref: 'User', index: true },
    // Denormalised so the public review list needs no extra user lookup.
    customerName: { type: String, required: true, trim: true },
    customerImage: { type: String, default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  {
    timestamps: true,
    collection: 'reviews',
  },
);

reviewSchema.index({ itemId: 1, createdAt: -1 });

export const Review =
  (models.Review as Model<ReviewDocument>) || model<ReviewDocument>('Review', reviewSchema);
