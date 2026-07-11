'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';
import { resetPasswordSchema } from '@codecard/validation';
import { AuthShell } from '@/components/auth/auth-shell';
import { mapPasswordResetClientError } from '@/lib/auth/password-recovery';

const SETUP_MSG =
  'Add Supabase keys to apps/web/.env.local (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).';

type RecoveryState = 'checking' | 'ready' | 'invalid';

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking');
  const submitLock = useRef(false);

  const authConfigured = isSupabasePublicKeyConfigured();

  useEffect(() => {
    if (!authConfigured) {
      setRecoveryState('invalid');
      return;
    }

    let cancelled = false;

    async function verifyRecoverySession() {
      const supabase = createClient();
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (cancelled) return;

      if (sessionError || !data.session) {
        setRecoveryState('invalid');
        return;
      }

      setRecoveryState('ready');
    }

    void verifyRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [authConfigured]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (submitLock.current || loading || recoveryState !== 'ready') return;

    if (!authConfigured) {
      setError(SETUP_MSG);
      return;
    }

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Check your password and try again');
      return;
    }

    submitLock.current = true;
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        setRecoveryState('invalid');
        setError('This reset link has expired or is invalid. Request a new one.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (updateError) {
        setError(mapPasswordResetClientError());
        return;
      }

      await supabase.auth.signOut();
      router.push('/sign-in?reset=success');
      router.refresh();
    } catch {
      setError(mapPasswordResetClientError());
    } finally {
      submitLock.current = false;
      setLoading(false);
    }
  }

  if (recoveryState === 'checking') {
    return (
      <AuthShell title="Set a new password" subtitle="Checking your reset link…">
        <p className="text-[14px] text-[#7a7876]" role="status" aria-busy="true">
          One moment…
        </p>
      </AuthShell>
    );
  }

  if (recoveryState === 'invalid') {
    return (
      <AuthShell
        title="Reset link unavailable"
        subtitle="This link may have expired or already been used."
      >
        <p className="text-[14px] text-[#7a7876]" role="alert">
          Request a new password reset email to continue.
        </p>
        <Link
          href="/forgot-password"
          className="cc-btn-pill-primary mt-6 flex w-full justify-center py-2.5 text-[15px]"
        >
          Request new link
        </Link>
        <p className="mt-6 text-center text-[14px] text-[#7a7876]">
          <Link href="/sign-in" className="font-medium text-[#222222] underline-offset-2 hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password for your account.">
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div className="space-y-2">
          <label htmlFor="password" className="text-[14px] font-medium text-[#222222]">
            New password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            required
            autoComplete="new-password"
            className="cc-input w-full"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-[14px] font-medium text-[#222222]">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError('');
            }}
            required
            autoComplete="new-password"
            className="cc-input w-full"
          />
        </div>
        {error && (
          <p className="text-[14px] text-[#df6a6b]" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="cc-btn-pill-primary w-full py-2.5 text-[15px]"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Updating…' : 'Update password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
