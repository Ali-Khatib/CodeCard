'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  EMAIL_VERIFICATION_COOLDOWN_MS,
  EMAIL_VERIFICATION_GENERIC_ERROR,
  EMAIL_VERIFICATION_GENERIC_SUCCESS,
  isVerificationCooldownActive,
} from '@/lib/auth/email-verification';

export function EmailVerificationBanner({ email }: { email: string }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const resendLock = useRef(false);

  const onCooldown = isVerificationCooldownActive(cooldownUntil);

  async function handleResend() {
    if (resendLock.current || resendLoading || onCooldown) return;

    setError('');
    setMessage('');
    resendLock.current = true;
    setResendLoading(true);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) {
        setError(EMAIL_VERIFICATION_GENERIC_ERROR);
        return;
      }

      setMessage(EMAIL_VERIFICATION_GENERIC_SUCCESS);
      setCooldownUntil(Date.now() + EMAIL_VERIFICATION_COOLDOWN_MS);
    } catch {
      setError(EMAIL_VERIFICATION_GENERIC_ERROR);
    } finally {
      resendLock.current = false;
      setResendLoading(false);
    }
  }

  async function handleRefresh() {
    if (refreshLoading) return;

    setError('');
    setMessage('');
    setRefreshLoading(true);

    try {
      const supabase = createClient();
      await supabase.auth.refreshSession();
      router.refresh();
    } catch {
      setError(EMAIL_VERIFICATION_GENERIC_ERROR);
    } finally {
      setRefreshLoading(false);
    }
  }

  return (
    <div
      className="mb-4 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-paper)] px-4 py-3 shadow-[0_8px_24px_rgba(34,34,34,0.06)]"
      role="status"
      aria-live="polite"
    >
      <p className="text-[14px] font-medium text-[var(--app-ink)]">Confirm your email</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--app-smoke)]">
        Check your inbox for a verification link so your account is fully active. If you did not
        receive it, you can resend the email or refresh your status after confirming.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="cc-app-btn cc-app-btn--primary"
          onClick={() => void handleResend()}
          disabled={resendLoading || onCooldown}
          aria-busy={resendLoading}
        >
          {resendLoading ? 'Sending…' : onCooldown ? 'Email sent' : 'Resend verification email'}
        </button>
        <button
          type="button"
          className="cc-app-btn cc-app-btn--ghost"
          onClick={() => void handleRefresh()}
          disabled={refreshLoading}
          aria-busy={refreshLoading}
        >
          {refreshLoading ? 'Refreshing…' : 'I verified — refresh'}
        </button>
      </div>
      {message && (
        <p className="mt-3 text-[13px] text-[var(--app-ink)]" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 text-[13px] text-[#df6a6b]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
