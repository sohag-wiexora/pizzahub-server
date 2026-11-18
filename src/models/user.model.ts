import mongoose, { type Document, type Model } from 'mongoose';
import { SUBSCRIPTION_PLANS, USER_ROLES } from '../constants/index.js';

const { model, models, Schema } = mongoose;

/**
 * Better Auth manages this collection from the Next.js client.
 * The server only reads it and updates the extra business fields
 * (role, isBlocked, subscription...) that Better Auth does not touch.
 * `strict: false` keeps unknown Better Auth fields intact on updates.
 */
export interface UserDocument extends Document<string> {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: (typeof USER_ROLES)[number];
  isBlocked: boolean;
  businessName: string | null;
  subscriptionPlan: (typeof SUBSCRIPTION_PLANS)[number];
  subscriptionExpiresAt: Date | null;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    image: { type: String, default: null },
    role: { type: String, enum: [...USER_ROLES], default: 'customer', index: true },
    isBlocked: { type: Boolean, default: false },
    businessName: { type: String, default: null },
    subscriptionPlan: { type: String, enum: [...SUBSCRIPTION_PLANS], default: 'free' },
    subscriptionExpiresAt: { type: Date, default: null },
    stripeCustomerId: { type: String, default: null },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'user',
  },
);

export const User = (models.User as Model<UserDocument>) || model<UserDocument>('User', userSchema);
