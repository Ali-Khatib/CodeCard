import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-utils';
import { recoverySessionForbiddenResponse } from '@/lib/auth/recovery-session-guard';
import {
  executeProfileUpdate,
  type ProfileUpdateState,
} from '@/lib/profile/profile-update-core';
import { revalidateOwnedProfileCaches } from '@/lib/profile/profile-update-revalidate';
import { isSameOriginMutation } from '@/lib/security/same-origin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Profile text is small. Reject obvious oversized bodies before parsing. */
const MAX_PROFILE_BODY_BYTES = 48 * 1024;

function statusFor(result: ProfileUpdateState): number {
  if (result.success) return 200;
  switch (result.code) {
    case 'unauthenticated':
      return 401;
    case 'not_found':
      return 404;
    case 'validation':
      return 422;
    case 'conflict':
      return 409;
    default:
      return 500;
  }
}

/**
 * Persist a profile edit without rendering the dashboard in the same response.
 * Server Actions re-render the current route before the button can leave
 * "Saving…". Home and the editor shell are dynamic, so that render was the wait.
 */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const started = performance.now();

  if (!isSameOriginMutation(request)) {
    return apiError('Forbidden', 403);
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_PROFILE_BODY_BYTES) {
    return apiError('Payload too large', 413);
  }

  const supabase = await createClient();
  const authStarted = performance.now();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authMs = Math.round(performance.now() - authStarted);

  if (!user) {
    return apiError('You must be signed in to update your profile.', 401);
  }

  const recoveryBlocked = recoverySessionForbiddenResponse(user);
  if (recoveryBlocked) return recoveryBlocked;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError('Malformed form data', 400);
  }

  const result = await executeProfileUpdate(supabase, formData, { user });
  if (result.success && !result.unchanged) {
    revalidateOwnedProfileCaches({
      previousSlug: result.previousSlug,
      nextSlug: result.nextSlug,
    });
  }

  console.info('[profile-update]', {
    requestId,
    totalMs: Math.round(performance.now() - started),
    authMs,
    readMs: result.diagnostics?.readMs ?? null,
    writeMs: result.diagnostics?.writeMs ?? null,
    ok: Boolean(result.success),
    unchanged: Boolean(result.unchanged),
    code: result.code ?? null,
  });

  return NextResponse.json(
    {
      success: Boolean(result.success),
      error: result.error,
      fieldErrors: result.fieldErrors,
      updatedAt: result.updatedAt,
    },
    {
      status: statusFor(result),
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

export async function GET() {
  return apiError('Method not allowed', 405);
}
