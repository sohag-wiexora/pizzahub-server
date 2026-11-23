import mongoose, { type Document, type Model } from 'mongoose';

const { model, models, Schema } = mongoose;

export type TransactionStatus = 'paid' | 'pending' | 'failed';

export interface TransactionDocument extends Document {
  vendorId: string;
  plan: string;
  amount: number;
  currency: string;
  stripeSessionId: string;
  stripeSubscriptionId: string | null;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    vendorId: { type: String, required: true, ref: 'User', index: true },
    plan: { type: String, default: 'premium' },
    
    // Amount is stored in major units (e.g. 9.99 USD), converted from Stripe's minor units.
    
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    stripeSessionId: { type: String, required: true, unique: true },
    stripeSubscriptionId: { type: String, default: null },
    status: { type: String, enum: [...(['paid', 'pending', 'failed'] as const)], default: 'paid' },
  },
  {
    timestamps: true,
    collection: 'transactions',
  },
);

export const Transaction =
  (models.Transaction as Model<TransactionDocument>) ||
  model<TransactionDocument>('Transaction', transactionSchema);
