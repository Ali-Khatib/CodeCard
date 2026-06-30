import { z } from 'zod';

/** Server-only secrets — never import from client components. */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  STRIPE_PRO_PRICE_ID: z.string().startsWith('price_').optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

let cachedServer: z.infer<typeof serverEnvSchema> | null = null;
let cachedPublic: z.infer<typeof publicEnvSchema> | null = null;

export function getServerEnv() {
  if (!cachedServer) {
    cachedServer = serverEnvSchema.parse(process.env);
  }
  return cachedServer;
}

export function getPublicEnv() {
  if (!cachedPublic) {
    cachedPublic = publicEnvSchema.parse({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  }
  return cachedPublic;
}

export function requireServerSecret(
  key: keyof Pick<
    NodeJS.ProcessEnv,
    | 'SUPABASE_SERVICE_ROLE_KEY'
    | 'STRIPE_SECRET_KEY'
    | 'STRIPE_WEBHOOK_SECRET'
    | 'UPSTASH_REDIS_REST_URL'
    | 'UPSTASH_REDIS_REST_TOKEN'
  >,
): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }
  return value;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Block accidental secret exposure via NEXT_PUBLIC_ prefix. */
export function assertNoLeakedPublicSecrets(): void {
  const forbidden = [
    'NEXT_PUBLIC_STRIPE',
    'NEXT_PUBLIC_SERVICE',
    'NEXT_PUBLIC_SECRET',
    'NEXT_PUBLIC_WEBHOOK',
    'NEXT_PUBLIC_UPSTASH',
  ];
  for (const key of Object.keys(process.env)) {
    if (forbidden.some((f) => key.startsWith(f))) {
      throw new Error(`Forbidden public env var detected: ${key}`);
    }
  }
}
