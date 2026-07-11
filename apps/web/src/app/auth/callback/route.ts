import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInternalRedirect } from '@/lib/auth/redirect';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = sanitizeInternalRedirect(searchParams.get('redirect'));

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
