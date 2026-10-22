import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-utils';
import { isSameOriginMutation } from '@/lib/security/same-origin';
import { createClient } from '@/lib/supabase/server';

/**
 * Best-effort sign-out for tab close (`sendBeacon` / `fetch` keepalive).
 * Clears Supabase session cookies even when the page is unloading.
 */
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return apiError('Forbidden', 403);
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'global' });
  } catch {
    // Tab may already be gone — still return ok so beacons don't retry loudly.
  }
  return NextResponse.json({ ok: true });
}
