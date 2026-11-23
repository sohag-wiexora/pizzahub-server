import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { auth } from './config/auth.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import apiRoutes from './routes.js';

const app = express();


app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigins,

    credentials: true,
  }),
);

app.get('/api/auth', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Better Auth is running. Use one of the endpoints below.',
    endpoints: [
      '/api/auth/ok',
      '/api/auth/get-session',
      '/api/auth/sign-in/email',
      '/api/auth/sign-up/email',
      '/api/auth/sign-out',
      '/api/auth/jwks',
    ],
  });
});

app.all('/api/auth', toNodeHandler(auth));
app.all('/api/auth/', toNodeHandler(auth));
app.all('/api/auth/*splat', toNodeHandler(auth));


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
