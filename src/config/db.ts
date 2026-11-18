import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async (): Promise<void> => {
  mongoose.connection.on('error', (error) => {
    console.error('✗ MongoDB connection error:', error.message);
  });

  await mongoose.connect(env.MONGODB_URI);
  console.log(`✓ MongoDB connected → ${mongoose.connection.host}/${mongoose.connection.name}`);
};
