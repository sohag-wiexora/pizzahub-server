import mongoose, { type Document, type Model, type Types } from 'mongoose';
import { ORDER_STATUSES } from '../constants/index.js';

const { model, models, Schema } = mongoose;

export interface OrderDocument extends Document {
  itemId: Types.ObjectId;
  vendorId: string;
  customerId: string;
  deliveryDate: Date;
  deliveryAddress: string;
  message: string;
  status: (typeof ORDER_STATUSES)[number];
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<OrderDocument>(
  {
    itemId: { type: Schema.Types.ObjectId, required: true, ref: 'MenuItem' },
    vendorId: { type: String, required: true, ref: 'User', index: true },
    customerId: { type: String, required: true, ref: 'User', index: true },
    deliveryDate: { type: Date, required: true },
    deliveryAddress: { type: String, required: true, trim: true },
    message: { type: String, default: '', trim: true },
    status: { type: String, enum: [...ORDER_STATUSES], default: 'pending', index: true },
  },
  {
    timestamps: true,
    collection: 'orders',
  },
);

export const Order = (models.Order as Model<OrderDocument>) || model<OrderDocument>('Order', orderSchema);
