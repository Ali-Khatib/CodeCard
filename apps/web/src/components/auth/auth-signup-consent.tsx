'use client';

import { useId } from 'react';
import Link from 'next/link';
import { MINIMUM_ACCOUNT_AGE_YEARS } from '@/lib/legal/constants';

type AuthSignupConsentProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  error?: string;
  disabled?: boolean;
};

export function AuthSignupConsent({
  checked,
  onChange,
  error,
  disabled,
}: AuthSignupConsentProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-1 h-4 w-4 shrink-0 rounded border-[rgba(34,34,34,0.2)] text-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-iris"
        />
        <label htmlFor={id} className="text-[13px] leading-relaxed text-smoke">
          I am at least {MINIMUM_ACCOUNT_AGE_YEARS} years old and agree to the{' '}
          <Link
            href="/legal/terms"
            className="font-medium text-ink underline underline-offset-2 hover:opacity-70"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/legal/privacy"
            className="font-medium text-ink underline underline-offset-2 hover:opacity-70"
          >
            Privacy Policy
          </Link>
          . This is not marketing consent.
        </label>
      </div>
      <div className="min-h-[18px]" aria-live="polite">
        {error ? (
          <p id={errorId} className="mt-1 text-[12px] leading-snug text-[#b45353]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
