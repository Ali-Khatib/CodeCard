import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function validationError(error: ZodError) {
  const message = error.errors.map((e) => e.message).join(', ');
  return apiError(message, 422);
}

export function unauthorized() {
  return apiError('Unauthorized', 401);
}

export function rateLimited() {
  return apiError('Too many requests', 429);
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
