import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Best-effort sign-out for tab close (`sendBeacon` / `fetch` keepalive).
 * Clears Supabase session cookies even when the page is unloading.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'global' });
  } catch {
    // Tab may already be gone — still return ok so beacons don't retry loudly.
  }
  return NextResponse.json({ ok: true });
}
