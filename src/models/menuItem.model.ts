import mongoose, { type Document, type Model } from 'mongoose';
import { MENU_ITEM_STATUSES, PIZZA_CATEGORIES } from '../constants/index.js';

const { model, models, Schema } = mongoose;

export interface MenuItemDocument extends Document {
  vendorId: string;
  itemName: string;
  category: (typeof PIZZA_CATEGORIES)[number];
  description: string;
  price: number;
  location: string;
  images: string[];
  status: (typeof MENU_ITEM_STATUSES)[number];
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<MenuItemDocument>(
  {
    vendorId: { type: String, required: true, ref: 'User', index: true },
    itemName: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: [...PIZZA_CATEGORIES] },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true },
    images: { type: [String], required: true },
    status: { type: String, enum: [...MENU_ITEM_STATUSES], default: 'pending', index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    collection: 'menuItems',
  },
);

export const MenuItem =
  (models.MenuItem as Model<MenuItemDocument>) || model<MenuItemDocument>('MenuItem', menuItemSchema);
