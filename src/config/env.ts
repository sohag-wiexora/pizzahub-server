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

  // Comma separated list of allowed frontend origins
  CLIENT_URL: z.string().default('http://localhost:3000'),

  // JWKS endpoint exposed by Better Auth in the Next.js client
  JWT_JWKS_URL: z.string().url('JWT_JWKS_URL must be a valid URL'),

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

export const env = {
  ...parsed.data,
  clientOrigins: parseOrigins(parsed.data.CLIENT_URL),
};

export type Env = typeof env;
