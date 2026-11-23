import mongoose, { type Document, type Model, type Types } from 'mongoose';
import { SUBSCRIPTION_PLANS, USER_ROLES } from '../constants/index.js';

const { model, models, Schema } = mongoose;

/**
 * Better Auth generates the user ids itself (MongoDB ObjectId hex string),
 * so this collection stores `_id` as an ObjectId — the same convention the
 * auth JWT subject and the rest of the API identifiers use.
 */

export interface UserDocument extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
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
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
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
    stripeSubscriptionId: { type: String, default: null },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'user',
  },
);

export const User = (models.User as Model<UserDocument>) || model<UserDocument>('User', userSchema);
