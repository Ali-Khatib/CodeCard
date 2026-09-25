import { NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@codecard/validation';
import { secureJsonRoute } from '@/lib/security/secure-route';
import { createServiceClient } from '@/lib/supabase/server';
import { getSupabasePublicKey, getSupabaseUrl } from '@/lib/supabase/public-key';
import {
  passwordResetRedirectUrl,
  passwordResetTokenCallbackUrl,
} from '@/lib/auth/password-recovery';
import { sendPasswordResetEmail } from '@/lib/auth/send-recovery-email';
import { isSameOriginMutation } from '@/lib/security/same-origin';

/**
 * Public password-reset intake.
 * Always returns the same success payload so the route cannot probe accounts.
 * Prefers a CodeCard mailbox send; falls back to Supabase Auth recover.
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

      try {
        const admin = await createServiceClient();
        const generated = await admin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: { redirectTo },
        });
        const tokenHash = generated.data.properties?.hashed_token;
        const resetUrl = tokenHash
          ? passwordResetTokenCallbackUrl(tokenHash)
          : generated.data.properties?.action_link;
        if (resetUrl) {
          const sent = await sendPasswordResetEmail(email, resetUrl);
          if (sent) {
            return NextResponse.json(
              { ok: true },
              { status: 200, headers: { 'Cache-Control': 'no-store' } },
            );
          }
        }
      } catch {
        // Fall through to Supabase recover so a missing mailbox still tries Auth SMTP.
      }

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
