import type { ZodSchema } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import {
  apiError,
  getClientIp,
  internalError,
  rateLimited,
  unauthorized,
  validationError,
} from '@/lib/api-utils';
import { parseJsonBody } from '@/lib/security/request';
import { createClient } from '@/lib/supabase/server';
import { isProduction } from '@/lib/security/env';
import type { RATE_LIMITS } from '@codecard/config';

type RateLimitType = keyof typeof RATE_LIMITS;

interface SecureRouteOptions<T> {
  schema: ZodSchema<T>;
  rateLimitType: RateLimitType;
  requireAuth?: boolean;
  maxBodyBytes?: number;
  /** Stricter: fail if Redis unavailable in production */
  strictRateLimit?: boolean;
  /**
   * Reject non-JSON Content-Type when the header is present.
   * Default true for ordinary JSON APIs.
   */
  requireJsonContentType?: boolean;
}

function hasJsonContentType(request: Request): boolean {
  const contentType = request.headers.get('content-type');
  if (!contentType) return true;
  return contentType.toLowerCase().includes('application/json');
}

export async function secureJsonRoute<T, R>(
  request: Request,
  options: SecureRouteOptions<T>,
  handler: (data: T, ctx: { userId: string | null; ip: string }) => Promise<R>,
): Promise<R | ReturnType<typeof apiError>> {
  try {
    const ip = getClientIp(request);
    const rlKey = `${options.rateLimitType}:${ip}`;

    const { success } = await rateLimit(rlKey, options.rateLimitType);
    if (!success) return rateLimited();
    if (options.strictRateLimit && isProduction() && !process.env.UPSTASH_REDIS_REST_URL) {
      return apiError('Service temporarily unavailable', 503);
    }

    if (options.requireJsonContentType !== false && !hasJsonContentType(request)) {
      return apiError('Unsupported content type', 415);
    }

    let userId: string | null = null;
    if (options.requireAuth) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return unauthorized();
      userId = user.id;

      const userRl = await rateLimit(`${options.rateLimitType}:user:${user.id}`, options.rateLimitType);
      if (!userRl.success) return rateLimited();
    }

    const parsed = await parseJsonBody(request, options.maxBodyBytes);
    if (!parsed.ok) return parsed.response;

    const validated = options.schema.safeParse(parsed.data);
    if (!validated.success) return validationError(validated.error);

    return await handler(validated.data, { userId, ip });
  } catch {
    // Never forward provider / unexpected exception details to clients.
    return internalError();
  }
}
