import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { auth } from './config/auth.js';
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
    // Session cookies from the Next.js client must be accepted cross-origin.
    credentials: true,
  }),
);

// Better Auth handles its own body parsing and cookies, so it is mounted
// before express.json(). It serves sign-up, sign-in, Google OAuth callbacks,
// session handling, /token and the JWKS endpoint under /api/auth/*.
// Express 5 uses path-to-regexp v8, so wildcards must be named (`*splat`);
// a bare `*` would throw at startup.
//
// Better Auth only serves concrete endpoints (/ok, /get-session,
// /sign-in/email, ...), so the bare base path would fall through to the 404
// handler. Answer it with a small index instead — handy for health checks.
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
