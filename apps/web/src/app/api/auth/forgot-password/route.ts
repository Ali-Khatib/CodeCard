import { NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@codecard/validation';
import { secureJsonRoute } from '@/lib/security/secure-route';
import { getSupabasePublicKey, getSupabaseUrl } from '@/lib/supabase/public-key';
import { passwordResetRedirectUrl } from '@/lib/auth/password-recovery';
import { isSameOriginMutation } from '@/lib/security/same-origin';

/**
 * Public password-reset intake.
 * Asks Supabase Auth to send the recovery email. Always returns the same
 * success payload so the route cannot probe accounts.
 */
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return secureJsonRoute(
    request,
    {
      schema: forgotPasswordSchema,
      rateLimitType: 'auth',
      maxBodyBytes: 4 * 1024,
    },
    async (data) => {
      const email = data.email.trim().toLowerCase();
      const redirectTo = passwordResetRedirectUrl();
      const supabaseUrl = getSupabaseUrl();
      const anon = getSupabasePublicKey();

      if (supabaseUrl && anon) {
        try {
          await fetch(
            `${supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
            {
              method: 'POST',
              headers: {
                apikey: anon,
                Authorization: `Bearer ${anon}`,
                'content-type': 'application/json',
              },
              body: JSON.stringify({ email }),
            },
          );
        } catch {
          // Same generic success either way.
        }
      }

      return NextResponse.json(
        { ok: true },
        { status: 200, headers: { 'Cache-Control': 'no-store' } },
      );
    },
  );
}
