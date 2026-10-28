import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIp, unauthorized } from '@/lib/api-utils';
import { recoverySessionForbiddenResponse } from '@/lib/auth/recovery-session-guard';
import { parseJsonBody } from '@/lib/security/request';
import { isSameOriginMutation } from '@/lib/security/same-origin';
import { FEATURE_DISABLED_MESSAGE, isFeatureBlocked } from '@/lib/security/kill-switch';
import { rateLimit, type RateLimitResult } from '@/lib/rate-limit';
import { resolveOwnedProfile } from '@/lib/profile/profile-auth-core';
import {
  buildResumeStoragePath,
  RESUME_MAX_BYTES,
  RESUME_MIME,
  RESUME_UPLOAD_BUCKET,
  validateResumeUploadMeta,
} from '@/lib/profile/resume-core';
import { UPLOAD_CONTENT_PREFIX_BASE64_MAX } from '@/lib/storage/upload-content-prefix';

function jsonNoStore(body: unknown, status: number, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function denyUploadRateLimit(decision: RateLimitResult) {
  if (decision.success) return null;
  if (decision.denial === 'misconfigured' || decision.denial === 'unavailable') {
    return jsonNoStore(
      {
        error: 'CV upload is temporarily unavailable. Try again shortly.',
        code: 'upload_unavailable',
      },
      503,
    );
  }
  const headers: Record<string, string> = {};
  if (decision.retryAfterSeconds && decision.retryAfterSeconds > 0) {
    headers['Retry-After'] = String(decision.retryAfterSeconds);
  }
  return jsonNoStore({ error: 'Too many requests', code: 'rate_limited' }, 429, headers);
}

function decodePrefix(value: string): Uint8Array | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > UPLOAD_CONTENT_PREFIX_BASE64_MAX) return null;
  if (!/^[A-Za-z0-9+/]+=*$/.test(trimmed)) return null;
  try {
    return new Uint8Array(Buffer.from(trimmed, 'base64'));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (isFeatureBlocked('uploads')) {
    return jsonNoStore({ error: FEATURE_DISABLED_MESSAGE }, 503);
  }

  if (!isSameOriginMutation(request)) {
    return jsonNoStore({ error: 'Forbidden' }, 403);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonNoStore({ error: 'Expected application/json' }, 400);
  }

  const ip = getClientIp(request);
  if (ip && ip !== 'unknown') {
    const ipLimit = await rateLimit(`upload:ip:${ip}`, 'upload');
    const denied = denyUploadRateLimit(ipLimit);
    if (denied) return denied;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const recoveryBlocked = recoverySessionForbiddenResponse(user);
  if (recoveryBlocked) return recoveryBlocked;

  const userLimit = await rateLimit(`upload:user:${user.id}`, 'upload');
  const userDenied = denyUploadRateLimit(userLimit);
  if (userDenied) return userDenied;

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return jsonNoStore({ error: 'Invalid request.' }, 400);
  }

  const body = parsedBody.data as {
    mimeType?: unknown;
    size?: unknown;
    contentPrefixBase64?: unknown;
  };

  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';
  const size = typeof body.size === 'number' ? body.size : Number.NaN;
  const prefixRaw = typeof body.contentPrefixBase64 === 'string' ? body.contentPrefixBase64 : '';
  const prefix = decodePrefix(prefixRaw);
  if (!prefix) {
    return jsonNoStore({ error: 'Invalid file content preview.' }, 400);
  }

  const validated = validateResumeUploadMeta({ mimeType, size, contentPrefix: prefix });
  if (!validated.ok) {
    return jsonNoStore({ error: validated.message }, validated.status);
  }

  const resolved = await resolveOwnedProfile(supabase, user);
  if ('error' in resolved) {
    return jsonNoStore({ error: resolved.error }, 400);
  }

  const path = buildResumeStoragePath(resolved.profile.owner_user_id);
  const { data, error } = await supabase.storage
    .from(RESUME_UPLOAD_BUCKET)
    .createSignedUploadUrl(path, { upsert: true });

  if (error || !data?.signedUrl || !data.token) {
    console.error('[upload/resume] createSignedUploadUrl failed', {
      message: error?.message ?? 'missing signedUrl/token',
    });
    return jsonNoStore({ error: 'Could not prepare upload. Please try again.' }, 500);
  }

  return jsonNoStore(
    {
      bucket: RESUME_UPLOAD_BUCKET,
      path,
      signedUrl: data.signedUrl,
      token: data.token,
      mimeType: RESUME_MIME,
      maxBytes: RESUME_MAX_BYTES,
    },
    200,
  );
}
