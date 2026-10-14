import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RATE_LIMITS } from '@codecard/config';
import { isProduction } from '@/lib/security/env';

/** One attempt. A hung Upstash call must not sit on retries before the route answers. */
const REDIS_ATTEMPT_MS = 1500;

export type RateLimitDenial = 'quota' | 'misconfigured' | 'unavailable';

export type RateLimitResult = {
  success: boolean;
  remaining?: number;
  /**
   * Present only when `success` is false.
   * `quota` is a real limit hit. The other two are infrastructure, not usage.
   */
  denial?: RateLimitDenial;
  retryAfterSeconds?: number;
};

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({
    url,
    token,
    retry: { retries: 0 },
  });
}

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let settled = false;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('rate-limit-timeout'));
    }, ms);
    promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Endpoints where losing the limiter is worse than losing the endpoint. These
 * deny when the limit cannot be evaluated; everything else degrades to allow so
 * a Redis outage cannot take down public reads.
 */
const STRICT_TYPES = new Set<keyof typeof RATE_LIMITS>(['ai', 'upload', 'auth']);

/**
 * Whether an unevaluable limit should deny. Mirrors the missing-config policy so
 * "Redis absent" and "Redis unreachable" cannot diverge.
 *
 * `CODECARD_E2E=1` marks the isolated E2E backend (server-only, never set in
 * production), where a production build is served locally without Redis.
 */
function failClosed(type: keyof typeof RATE_LIMITS): boolean {
  const isolatedE2E = process.env.CODECARD_E2E === '1';
  return isProduction() && !isolatedE2E && STRICT_TYPES.has(type);
}

export async function rateLimit(
  key: string,
  type: keyof typeof RATE_LIMITS,
): Promise<RateLimitResult> {
  const redis = getRedis();

  if (!redis) {
    if (failClosed(type)) {
      console.error(`[rate-limit] Redis unavailable for strict endpoint: ${type}`);
      return { success: false, denial: 'misconfigured' };
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

  try {
    const result = await withDeadline(limiter.limit(key), REDIS_ATTEMPT_MS);
    if (!result.success) {
      const retryAfterSeconds =
        typeof result.reset === 'number'
          ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
          : undefined;
      return {
        success: false,
        remaining: result.remaining,
        denial: 'quota',
        retryAfterSeconds,
      };
    }
    return { success: true, remaining: result.remaining };
  } catch {
    /*
     * Redis is configured but unreachable or slower than REDIS_ATTEMPT_MS.
     * Never log the error: it can carry the REST URL and token.
     * Strict endpoints stay denied, but the denial is not a quota hit.
     */
    console.error(`[rate-limit] limiter unreachable for endpoint: ${type}`);
    if (failClosed(type)) {
      return { success: false, denial: 'unavailable' };
    }
    return { success: true };
  }
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

  try {
    const result = await limiter.limit(key);
    return { success: result.success };
  } catch {
    /* Paid AI spend: an unevaluable bucket always denies in production. */
    console.error('[rate-limit] token bucket unreachable');
    return { success: !isProduction() };
  }
}
