'use client';

import { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';
import { forgotPasswordSchema } from '@codecard/validation';
import { AuthShell } from '@/components/auth/auth-shell';
import {
  PASSWORD_RESET_COOLDOWN_MS,
  PASSWORD_RESET_GENERIC_ERROR,
  PASSWORD_RESET_GENERIC_SUCCESS,
} from '@/lib/auth/redirect';
import { isRecoveryCooldownActive, passwordResetRedirectUrl } from '@/lib/auth/password-recovery';

const SETUP_MSG =
  'Add Supabase keys to apps/web/.env.local (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const submitLock = useRef(false);

  const authConfigured = isSupabasePublicKeyConfigured();
  const onCooldown = isRecoveryCooldownActive(cooldownUntil);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (submitLock.current || loading || onCooldown) return;

    if (!authConfigured) {
      setError(SETUP_MSG);
      return;
    }

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Enter a valid email address');
      return;
    }

    submitLock.current = true;
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: passwordResetRedirectUrl(),
      });

      if (resetError) {
        setError(PASSWORD_RESET_GENERIC_ERROR);
        return;
      }

      setSuccess(true);
      setCooldownUntil(Date.now() + PASSWORD_RESET_COOLDOWN_MS);
    } catch {
      setError(PASSWORD_RESET_GENERIC_ERROR);
    } finally {
      submitLock.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we will send a reset link if an account exists."
    >
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-[14px] font-medium text-[#222222]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
              if (success) setSuccess(false);
            }}
            required
            autoComplete="email"
            className="cc-input w-full"
          />
        </div>
        {error && (
          <p className="text-[14px] text-[#df6a6b]" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-[14px] text-[#2f6f4e]" role="status">
            {PASSWORD_RESET_GENERIC_SUCCESS}
          </p>
        )}
        <button
          type="submit"
          className="cc-btn-pill-primary w-full py-2.5 text-[15px]"
          disabled={loading || onCooldown}
          aria-busy={loading}
        >
          {loading ? 'Sending…' : onCooldown ? 'Email sent' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-[#7a7876]">
        <Link href="/sign-in" className="font-medium text-[#222222] underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
