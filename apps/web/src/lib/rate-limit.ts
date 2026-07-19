import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RATE_LIMITS } from '@codecard/config';
import { isProduction } from '@/lib/security/env';

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function rateLimit(
  key: string,
  type: keyof typeof RATE_LIMITS,
): Promise<{ success: boolean; remaining?: number }> {
  const redis = getRedis();

  if (!redis) {
    // Strict endpoints fail closed without Redis in production, except in the
    // isolated E2E backend mode (CODECARD_E2E=1, server-only, never set in
    // production) where the app is a production build served locally.
    const isolatedE2E = process.env.CODECARD_E2E === '1';
    if (isProduction() && !isolatedE2E && (type === 'ai' || type === 'upload' || type === 'auth')) {
      console.error(`[rate-limit] Redis unavailable for strict endpoint: ${type}`);
      return { success: false };
    }
    return { success: true };
  }

  const config = RATE_LIMITS[type];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: 'codecard',
  });

  const result = await limiter.limit(key);
  return { success: result.success, remaining: result.remaining };
}

/** Token bucket for burst-sensitive paid AI endpoints */
export async function rateLimitTokenBucket(
  key: string,
  tokens: number,
  refill: `${number} ${'s' | 'm' | 'h'}`,
): Promise<{ success: boolean }> {
  const redis = getRedis();
  if (!redis) {
    if (isProduction()) return { success: false };
    return { success: true };
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(tokens, refill, tokens),
    prefix: 'codecard:ai',
  });

  const result = await limiter.limit(key);
  return { success: result.success };
}
