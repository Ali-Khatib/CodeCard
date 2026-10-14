import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const INTERNAL_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Opaque production 500 — never include stacks, SQL, or provider messages. */
export function internalError() {
  return apiError(INTERNAL_ERROR_MESSAGE, 500);
}

export function validationError(error: ZodError) {
  const message = error.errors.map((e) => e.message).join(', ');
  return apiError(message, 422);
}

export function unauthorized() {
  return apiError('Unauthorized', 401);
}

export function rateLimited(retryAfterSeconds?: number) {
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: retryAfterSeconds && retryAfterSeconds > 0
        ? { 'Retry-After': String(retryAfterSeconds) }
        : undefined,
    },
  );
}

/** Quota stays 429. Missing or unreachable Redis is a service failure, not a quota hit. */
export function responseForDeniedRateLimit(decision: {
  success: boolean;
  denial?: 'quota' | 'misconfigured' | 'unavailable';
  retryAfterSeconds?: number;
}) {
  if (decision.success) return null;
  if (decision.denial === 'misconfigured' || decision.denial === 'unavailable') {
    return apiError('Service temporarily unavailable', 503);
  }
  return rateLimited(decision.retryAfterSeconds);
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
