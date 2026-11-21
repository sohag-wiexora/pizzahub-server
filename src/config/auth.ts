import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { bearer, jwt } from 'better-auth/plugins';
import { MongoClient } from 'mongodb';
import { env } from './env.js';

/**
 * Better Auth lives on this server. It owns the auth collections
 * (user, session, account, verification) and talks to MongoDB through
 * its own client, while the rest of the API reads the same `user`
 * collection through Mongoose.
 */
const mongoClient = new MongoClient(env.MONGODB_URI);
const db = mongoClient.db();

/** Signup password policy: 6+ characters, one uppercase and one lowercase letter. */
const meetsPasswordPolicy = (password: string): boolean =>
  password.length >= 6 && /[A-Z]/.test(password) && /[a-z]/.test(password);

export const auth = betterAuth({
  appName: 'PizzaHub',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  database: mongodbAdapter(db, { client: mongoClient }),
  trustedOrigins: env.clientOrigins,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  user: {
    // Extra business fields stored on the Better Auth user document.
    // input: false keeps the client from writing moderation/subscription fields.
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'customer', input: true },
      businessName: { type: 'string', required: false, input: true },
      isBlocked: { type: 'boolean', required: false, defaultValue: false, input: false },
      subscriptionPlan: { type: 'string', required: false, defaultValue: 'free', input: false },
      subscriptionExpiresAt: { type: 'date', required: false, input: false },
      stripeCustomerId: { type: 'string', required: false, input: false },
      stripeSubscriptionId: { type: 'string', required: false, input: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const requestedRole = (user as { role?: string }).role;

          // Admins are only created by the secure seed script — never by signup.
          if (requestedRole === 'admin') {
            throw new APIError('FORBIDDEN', {
              message: 'Admin accounts cannot be created through public registration.',
            });
          }

          return {
            data: { ...user, role: requestedRole === 'vendor' ? 'vendor' : 'customer' },
          };
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-up/email') return;

      const password = (ctx.body as { password?: string } | undefined)?.password ?? '';
      if (!meetsPasswordPolicy(password)) {
        throw new APIError('BAD_REQUEST', {
          message:
            'Password must be at least 6 characters long and include one uppercase and one lowercase letter.',
        });
      }
    }),
  },

  plugins: [
    // jwt()   → issues JWTs and exposes /api/auth/jwks for verification
    // bearer() → allows the client to authenticate API calls with bearer tokens
    jwt(),
    bearer(),
  ],

  advanced: {
    // Cross-site cookies (Vercel client ↔ Render API) need SameSite=None in production.
    defaultCookieAttributes:
      env.NODE_ENV === 'production' ? { sameSite: 'none', secure: true } : {},
  },
});

/** Closes the MongoDB client Better Auth owns (used during graceful shutdown). */
export const closeAuthClient = (): Promise<void> => mongoClient.close();
