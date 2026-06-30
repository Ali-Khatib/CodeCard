import { BODY_LIMITS } from '@codecard/config';
import { apiError } from '@/lib/api-utils';

export type ParseBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: ReturnType<typeof apiError> };

export async function readBodyWithLimit(
  request: Request,
  maxBytes: number = BODY_LIMITS.json,
): Promise<{ ok: true; text: string } | { ok: false; response: ReturnType<typeof apiError> }> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > maxBytes) {
    return { ok: false, response: apiError('Payload too large', 413) };
  }

  const text = await request.text();
  if (text.length > maxBytes) {
    return { ok: false, response: apiError('Payload too large', 413) };
  }

  return { ok: true, text };
}

export async function parseJsonBody<T = unknown>(
  request: Request,
  maxBytes: number = BODY_LIMITS.json,
): Promise<ParseBodyResult<T>> {
  const body = await readBodyWithLimit(request, maxBytes);
  if (!body.ok) return body;

  if (!body.text.trim()) {
    return { ok: false, response: apiError('Empty body', 400) };
  }

  try {
    return { ok: true, data: JSON.parse(body.text) as T };
  } catch {
    return { ok: false, response: apiError('Malformed JSON', 400) };
  }
}
