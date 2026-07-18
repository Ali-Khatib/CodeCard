'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import {
  isExactAccountDeletionConfirmation,
  requestAccountDeletion,
} from '@/lib/account/account-deletion-client';
import { ACCOUNT_DELETION_CONFIRMATION } from '@/lib/account/delete-schema';
import { authCallbackRedirectUrl } from '@/lib/auth/redirect';
import { MUTATION_FEEDBACK } from '@/lib/dashboard/mutation-feedback';
import { createClient } from '@/lib/supabase/client';

export type AccountDeletionAuthMode = {
  hasPassword: boolean;
  /** Preferred OAuth provider for reauthentication when password is unavailable. */
  oauthProvider: 'github' | 'google' | null;
};

type AccountDeletionDialogProps = {
  live: boolean;
  auth: AccountDeletionAuthMode;
  email?: string;
  /** When true (returned from OAuth), open dialog and treat reauth as recent. */
  initiallyOpen?: boolean;
  /**
   * Optional password reauth override for browser fixtures.
   * Production always uses Supabase Auth via the default implementation.
   */
  passwordReauth?: (input: {
    email: string;
    password: string;
  }) => Promise<{ ok: boolean }>;
};

type Phase = 'idle' | 'submitting';

export function AccountDeletionDialog({
  live,
  auth,
  email,
  initiallyOpen = false,
  passwordReauth,
}: AccountDeletionDialogProps) {
  const { notifySuccess, notifyError } = useMutationFeedback();
  const titleId = useId();
  const descId = useId();
  const confirmInputId = useId();
  const passwordInputId = useId();
  const errorId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const inFlightRef = useRef(false);

  const [open, setOpen] = useState(initiallyOpen);
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [oauthRecent, setOauthRecent] = useState(initiallyOpen);
  const [error, setError] = useState('');
  const [invalidField, setInvalidField] = useState<'confirmation' | 'password' | null>(null);
  const [oauthPending, setOauthPending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const confirmationValid = isExactAccountDeletionConfirmation(confirmation);
  const reauthSatisfied = auth.hasPassword
    ? passwordVerified
    : Boolean(auth.oauthProvider) && oauthRecent;
  const submitEnabled =
    confirmationValid && reauthSatisfied && phase !== 'submitting' && !inFlightRef.current;

  const resetLocalState = useCallback(() => {
    setConfirmation('');
    setPassword('');
    setPasswordVerified(false);
    setError('');
    setInvalidField(null);
    setOauthPending(false);
    setPhase('idle');
    inFlightRef.current = false;
    // Keep oauthRecent if we arrived from OAuth return; clearing only on cancel after submit fail is fine.
  }, []);

  const closeDialog = useCallback(() => {
    if (phase === 'submitting') return;
    setOpen(false);
    resetLocalState();
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, [phase, resetLocalState]);

  useEffect(() => {
    if (!open) return;

    const node = dialogRef.current;
    const focusable = node?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && phase !== 'submitting') {
        event.preventDefault();
        closeDialog();
      }
      if (event.key !== 'Tab' || !node) return;
      const items = Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeDialog, open, phase]);

  const openDialog = () => {
    setConfirmation('');
    setPassword('');
    setPasswordVerified(false);
    setError('');
    setInvalidField(null);
    setOauthPending(false);
    setPhase('idle');
    inFlightRef.current = false;
    setOpen(true);
  };

  const verifyPassword = async () => {
    setError('');
    setInvalidField(null);
    if (!auth.hasPassword || !email) {
      setError('Password reauthentication is not available for this account.');
      return;
    }
    if (!password) {
      setError('Enter your current password to continue.');
      setInvalidField('password');
      passwordInputRef.current?.focus();
      return;
    }

    const currentPassword = password;
    setPassword('');

    let ok = false;
    if (passwordReauth) {
      const result = await passwordReauth({ email, password: currentPassword });
      ok = result.ok;
    } else {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      ok = !authError && Boolean(data.user);
    }

    if (!ok) {
      setPasswordVerified(false);
      setError('That password is incorrect. Your account was not deleted.');
      setInvalidField('password');
      passwordInputRef.current?.focus();
      return;
    }

    setPasswordVerified(true);
  };

  const startOAuthReauth = async () => {
    if (!auth.oauthProvider) {
      setError(
        'Please sign in again with your connected provider, then return to Settings to delete your account.',
      );
      return;
    }
    setOauthPending(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: auth.oauthProvider,
        options: {
          redirectTo: authCallbackRedirectUrl('/dashboard/settings?delete=1'),
        },
      });
      if (oauthError) {
        setError('Could not start reauthentication. Your account was not deleted.');
        setOauthPending(false);
      }
    } catch {
      setError('Could not start reauthentication. Your account was not deleted.');
      setOauthPending(false);
    }
  };

  const submitDeletion = async () => {
    if (!submitEnabled) return;
    if (!confirmationValid) {
      setError('Type DELETE exactly to confirm. Your account was not deleted.');
      setInvalidField('confirmation');
      confirmInputRef.current?.focus();
      return;
    }
    if (!reauthSatisfied) {
      setError('Reauthenticate before deleting. Your account was not deleted.');
      setInvalidField(auth.hasPassword ? 'password' : null);
      if (auth.hasPassword) passwordInputRef.current?.focus();
      return;
    }

    inFlightRef.current = true;
    setPhase('submitting');
    setError('');
    setInvalidField(null);

    const result = await requestAccountDeletion({
      confirmation: ACCOUNT_DELETION_CONFIRMATION,
      reauthentication: { method: 'recent_login' },
    });

    if (!result.ok) {
      inFlightRef.current = false;
      setPhase('idle');
      setError(result.message);
      notifyError(result.message, MUTATION_FEEDBACK.account.deleteFailed);
      if (result.code === 'REAUTHENTICATION_REQUIRED') {
        setPasswordVerified(false);
        setOauthRecent(false);
      }
      return;
    }

    notifySuccess(MUTATION_FEEDBACK.account.deleted);
    window.location.replace('/sign-in?reason=account_deleted');
  };

  const onConfirmKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.preventDefault();
  };

  if (!live) {
    return (
      <AsyncActionButton
        variant="ghost"
        successLabel="Demo only"
        ariaLabel="Demo delete account"
        onAction={async () => {
          await new Promise((r) => setTimeout(r, 420));
          notifySuccess(MUTATION_FEEDBACK.account.deleteDemo);
        }}
      >
        Delete account
      </AsyncActionButton>
    );
  }

  const providerLabel = auth.oauthProvider === 'github' ? 'GitHub' : 'Google';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="cc-app-btn cc-app-btn--ghost"
        aria-label="Delete account"
        onClick={openDialog}
        data-testid="account-deletion-open"
      >
        Delete account
      </button>

      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6"
              data-testid="account-deletion-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && phase !== 'submitting') {
                  closeDialog();
                }
              }}
            >
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descId}
                data-testid="account-deletion-dialog"
                className="max-h-[min(92dvh,720px)] w-full max-w-lg overflow-y-auto rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5 shadow-xl sm:p-6"
              >
                <h2 id={titleId} className="text-[20px] font-semibold text-[var(--app-ink)]">
                  Delete your CodeCard account?
                </h2>
                <div
                  id={descId}
                  className="mt-3 space-y-3 text-[14px] leading-relaxed text-[var(--app-smoke)]"
                >
                  <p>
                    Successful deletion permanently removes your CodeCard profile, projects,
                    research, uploaded media, and account access. An active subscription is
                    cancelled according to CodeCard’s billing rules.
                  </p>
                  <p>
                    Analytics may be anonymized rather than fully erased. A minimal privacy-safe
                    deletion audit and other legally necessary records may be retained. Export
                    anything you need before continuing.
                  </p>
                  <p>
                    Read the{' '}
                    <Link href="/legal/privacy" className="underline underline-offset-2">
                      Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link href="/legal/terms" className="underline underline-offset-2">
                      Terms
                    </Link>
                    .
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor={confirmInputId}
                      className="block text-[13px] font-medium text-[var(--app-ink)]"
                    >
                      Type {ACCOUNT_DELETION_CONFIRMATION} to confirm
                    </label>
                    <input
                      ref={confirmInputRef}
                      id={confirmInputId}
                      name="account-deletion-confirmation"
                      autoComplete="off"
                      spellCheck={false}
                      value={confirmation}
                      disabled={phase === 'submitting'}
                      onChange={(event) => {
                        setConfirmation(event.target.value);
                        if (invalidField === 'confirmation') setInvalidField(null);
                      }}
                      onKeyDown={onConfirmKeyDown}
                      aria-invalid={invalidField === 'confirmation' || undefined}
                      aria-describedby={
                        invalidField === 'confirmation' && error ? errorId : undefined
                      }
                      className="mt-1.5 w-full rounded-[12px] border border-[var(--app-border)] bg-[var(--app-canvas)] px-3 py-2.5 text-[14px] text-[var(--app-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ink)]"
                      placeholder={ACCOUNT_DELETION_CONFIRMATION}
                      data-testid="account-deletion-confirmation"
                    />
                  </div>

                  {auth.hasPassword ? (
                    <div>
                      <label
                        htmlFor={passwordInputId}
                        className="block text-[13px] font-medium text-[var(--app-ink)]"
                      >
                        Current password
                      </label>
                      <input
                        ref={passwordInputRef}
                        id={passwordInputId}
                        name="account-deletion-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        disabled={phase === 'submitting' || passwordVerified}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setPasswordVerified(false);
                          if (invalidField === 'password') setInvalidField(null);
                        }}
                        aria-invalid={invalidField === 'password' || undefined}
                        aria-describedby={
                          invalidField === 'password' && error ? errorId : undefined
                        }
                        className="mt-1.5 w-full rounded-[12px] border border-[var(--app-border)] bg-[var(--app-canvas)] px-3 py-2.5 text-[14px] text-[var(--app-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ink)]"
                        data-testid="account-deletion-password"
                      />
                      {!passwordVerified ? (
                        <div className="mt-2">
                          <button
                            type="button"
                            className="cc-app-btn cc-app-btn--soft"
                            disabled={!password || phase === 'submitting'}
                            onClick={() => {
                              void verifyPassword();
                            }}
                          >
                            Verify password
                          </button>
                        </div>
                      ) : (
                        <p className="mt-2 text-[13px] text-[var(--app-smoke)]" role="status">
                          Password verified. You can delete your account.
                        </p>
                      )}
                    </div>
                  ) : auth.oauthProvider ? (
                    <div className="space-y-2">
                      <p className="text-[13px] text-[var(--app-smoke)]">
                        Reauthenticate with {providerLabel} before deleting. You will return here
                        to finish.
                      </p>
                      {oauthRecent ? (
                        <p className="text-[13px] text-[var(--app-smoke)]" role="status">
                          Recent reauthentication detected. Confirm DELETE to continue.
                        </p>
                      ) : (
                        <button
                          type="button"
                          className="cc-app-btn cc-app-btn--soft"
                          disabled={oauthPending || phase === 'submitting'}
                          onClick={() => {
                            void startOAuthReauth();
                          }}
                        >
                          {oauthPending ? 'Redirecting…' : `Continue with ${providerLabel}`}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[13px] text-red-600" role="alert">
                      This account cannot complete server-verifiable reauthentication right now.
                      Deletion is blocked.
                    </p>
                  )}
                </div>

                {error ? (
                  <p id={errorId} className="mt-4 text-[13px] text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}

                {phase === 'submitting' ? (
                  <p
                    className="mt-4 text-[13px] text-[var(--app-smoke)]"
                    role="status"
                    aria-live="assertive"
                  >
                    Deleting your account… Please wait. Do not close this window.
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="cc-app-btn cc-app-btn--ghost"
                    disabled={phase === 'submitting'}
                    onClick={closeDialog}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!submitEnabled}
                    aria-busy={phase === 'submitting'}
                    data-testid="account-deletion-submit"
                    onClick={() => {
                      void submitDeletion();
                    }}
                    className="inline-flex h-10 items-center rounded-full bg-red-600 px-4 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {phase === 'submitting' ? 'Deleting…' : 'Permanently delete account'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
