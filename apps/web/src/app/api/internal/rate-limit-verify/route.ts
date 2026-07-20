import { Ratelimit } from '@upstash/ratelimit';
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/rate-limit';
import { getClientIp, rateLimited } from '@/lib/api-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * WS14-T016 — gated Upstash rate-limit verification probe.
 *
 * Enabled only when CODECARD_RATE_LIMIT_VERIFY=1. Uses a dedicated 3 req / 1 m
 * window so the test stays bounded and does not touch analytics, moderation,
 * or user data. Unset the env var immediately after a successful 429 check.
 */
export async function GET(request: Request) {
  if (process.env.CODECARD_RATE_LIMIT_VERIFY !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { error: 'Upstash Redis is not configured', redis: false },
      { status: 503 },
    );
  }

  const ip = getClientIp(request);
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    prefix: 'codecard:rl-verify',
    analytics: false,
  });

  const result = await limiter.limit(`probe:${ip}`);
  if (!result.success) {
    return rateLimited();
  }

  return NextResponse.json({
    ok: true,
    message: 'CodeCard WS14-T016 Upstash rate-limit verification',
    remaining: result.remaining,
    hint: 'Send this request until HTTP 429, then unset CODECARD_RATE_LIMIT_VERIFY.',
  });
}
