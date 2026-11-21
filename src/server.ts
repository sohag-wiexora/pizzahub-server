import mongoose from 'mongoose';
import app from './app.js';
import { closeAuthClient } from './config/auth.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const bootstrap = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`✓ PizzaHub API listening on port ${env.PORT} (${env.NODE_ENV})`);
    console.log(`✓ Better Auth ready at ${env.BETTER_AUTH_URL}/api/auth/*`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await mongoose.connection.close();
      await closeAuthClient();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
};

bootstrap().catch((error) => {
  console.error('✗ Failed to start PizzaHub API:', error);
  process.exit(1);
});
