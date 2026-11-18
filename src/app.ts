import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import apiRoutes from './routes.js';

const app = express();

// Render/Railway terminate TLS in front of the app.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigins,
    credentials: false,
  }),
);

// Stripe signature verification needs the untouched raw body, so the webhook
// is parsed with express.raw() BEFORE the global JSON parser takes over.
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'PizzaHub API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use(express.json({ limit: '1mb' }));
app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
