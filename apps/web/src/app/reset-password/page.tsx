'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';
import { resetPasswordSchema } from '@codecard/validation';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthPasswordField } from '@/components/auth/auth-password-field';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { AuthErrorAlert } from '@/components/auth/auth-error-alert';
import { mapPasswordResetClientError } from '@/lib/auth/password-recovery';
import { PASSWORD_REQUIREMENTS_SUMMARY } from '@/lib/auth/password-guidance';
import { withAuthNetworkRetry } from '@/lib/auth/auth-network-retry';

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
      const message = parsed.error.errors[0]?.message ?? PASSWORD_REQUIREMENTS_SUMMARY;
      setError(
        message.toLowerCase().includes('at least 1 character')
          ? PASSWORD_REQUIREMENTS_SUMMARY
          : message,
      );
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

      const { error: updateError } = await withAuthNetworkRetry(() =>
        supabase.auth.updateUser({
          password: parsed.data.password,
        }),
      );

      if (updateError) {
        setError(mapPasswordResetClientError());
        return;
      }

      await supabase.auth.signOut({ scope: 'global' });
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
        <AuthPasswordField
          id="password"
          label="New password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            if (error) setError('');
          }}
          required
          autoComplete="new-password"
          disabled={loading}
          showGuidance
        />
        <AuthPasswordField
          id="confirmPassword"
          label="Confirm password"
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            if (error) setError('');
          }}
          required
          autoComplete="new-password"
          disabled={loading}
        />
        <AuthErrorAlert message={error} />
        <AuthPrimaryButton
          pending={loading}
          pendingLabel="Updating…"
          idleLabel="Update password"
          disabled={loading}
        />
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
