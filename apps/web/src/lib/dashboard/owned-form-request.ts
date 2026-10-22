import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { apiError } from '@/lib/api-utils';
import { recoverySessionForbiddenResponse } from '@/lib/auth/recovery-session-guard';
import { isSameOriginMutation } from '@/lib/security/same-origin';
import { createClient } from '@/lib/supabase/server';

/** Card and paper forms carry case-study text. Reject obvious oversized bodies first. */
const DEFAULT_MAX_BODY_BYTES = 512 * 1024;

export type OwnedFormPost =
  | {
      ok: true;
      supabase: SupabaseClient;
      user: User;
      formData: FormData;
    }
  | { ok: false; response: NextResponse };

/**
 * Same session and origin checks as profile save, without a rate-limit hop.
 * A hung Redis call must not sit in front of the write.
 */
export async function readOwnedFormPost(
  request: Request,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<OwnedFormPost> {
  if (!isSameOriginMutation(request)) {
    return { ok: false, response: apiError('Forbidden', 403) };
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > maxBytes) {
    return { ok: false, response: apiError('Payload too large', 413) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: apiError('You must be signed in.', 401) };
  }

  const recoveryBlocked = recoverySessionForbiddenResponse(user);
  if (recoveryBlocked) return { ok: false, response: recoveryBlocked };

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return { ok: false, response: apiError('Malformed form data', 400) };
  }

  return { ok: true, supabase, user, formData };
}

export function ownedMutationJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function statusForOwnedMutation(result: {
  success?: boolean;
  errorCode?: string;
}): number {
  if (result.success) return 200;
  switch (result.errorCode) {
    case 'auth':
      return 401;
    case 'not_found':
      return 404;
    case 'validation':
    case 'slug_taken':
    case 'limit':
      return 422;
    default:
      return 400;
  }
}
