import 'dotenv/config';
import { z } from 'zod';

/**
 * All runtime environment variables are validated here, so the server
 * fails fast with a clear message when something is missing or invalid.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is missing from the environment'),

  // Comma separated list of allowed frontend origins (CORS + trusted origins)
  CLIENT_URL: z.string().default('http://localhost:3000'),

  // Better Auth
  BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL (the public URL of this API)'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters long'),
  // Optional override — defaults to ${BETTER_AUTH_URL}/api/auth/jwks
  JWT_JWKS_URL: z.string().url('JWT_JWKS_URL must be a valid URL').optional(),

  // Google OAuth (configured in Google Cloud Console, redirect URI: <BETTER_AUTH_URL>/api/auth/callback/google)
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is missing from the environment'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is missing from the environment'),

  // ImgBB image hosting (menu item images are uploaded through this API)
  IMGBB_API_KEY: z.string().min(1, 'IMGBB_API_KEY is missing from the environment'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is missing from the environment'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is missing from the environment'),
  STRIPE_PREMIUM_PRICE_ID: z.string().min(1, 'STRIPE_PREMIUM_PRICE_ID is missing from the environment'),
});

const parseOrigins = (value: string): string[] =>
  value
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('✗ Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.') || 'env'}: ${issue.message}`);
  }
  process.exit(1);
}

const baseAuthUrl = parsed.data.BETTER_AUTH_URL.replace(/\/+$/, '');

export const env = {
  ...parsed.data,
  clientOrigins: parseOrigins(parsed.data.CLIENT_URL),
  // The auth middleware verifies JWTs against Better Auth's JWKS endpoint.
  jwksUrl: parsed.data.JWT_JWKS_URL ?? `${baseAuthUrl}/api/auth/jwks`,
};

export type Env = typeof env;
