'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';
import { signInSchema } from '@codecard/validation';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthField } from '@/components/auth/auth-field';
import { AuthPasswordField } from '@/components/auth/auth-password-field';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { AuthGithubButton } from '@/components/auth/auth-github-button';
import { AuthErrorAlert } from '@/components/auth/auth-error-alert';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import { sanitizeInternalRedirect, authCallbackRedirectUrl } from '@/lib/auth/redirect';
import { isAuthSubmissionBlocked, oauthButtonLabel } from '@/lib/auth/auth-loading';
import { signInStatusMessage } from '@/lib/auth/session-expiry';
import { mapAuthFormError } from '@/lib/auth/map-auth-form-error';

const SETUP_MSG =
  'Add Supabase keys to apps/web/.env.local (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.get('redirect'));
  const resetSuccess = searchParams.get('reset') === 'success';
  const statusMessage = signInStatusMessage(searchParams.get('reason'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});
  const [emailLoading, setEmailLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'github' | null>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const submitLock = useRef(false);
  const oauthLock = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const authConfigured = isSupabasePublicKeyConfigured();
  const authBlocked = isAuthSubmissionBlocked({
    emailPending: emailLoading,
    oauthPending: oauthLoading,
  });

  useEffect(() => {
    router.prefetch('/sign-up');
  }, [router]);

  async function oauthGithub() {
    if (oauthLock.current || authBlocked) return;

    setError('');
    if (!authConfigured) {
      setError(SETUP_MSG);
      return;
    }

    oauthLock.current = true;
    setOauthLoading('github');

    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: authCallbackRedirectUrl(redirectTo),
        },
      });

      if (oauthError) {
        setError(mapAuthFormError(oauthError.message, 'sign-in'));
        setOauthLoading(null);
      }
    } catch {
      setError(mapAuthFormError('network', 'sign-in'));
      setOauthLoading(null);
    } finally {
      oauthLock.current = false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldError({});

    if (submitLock.current || authBlocked) return;

    if (!authConfigured) {
      setError(SETUP_MSG);
      return;
    }

    submitLock.current = true;
    setEmailLoading(true);

    try {
      const parsed = signInSchema.safeParse({ email, password });
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        const message = first?.message ?? 'Invalid input';
        if (first?.path?.[0] === 'email') {
          setFieldError({ email: message });
        } else if (first?.path?.[0] === 'password') {
          setFieldError({ password: message });
        }
        setError(mapAuthFormError(message, 'sign-in'));
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);

      if (authError) {
        setError(mapAuthFormError(authError.message, 'sign-in'));
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }

      setFadingOut(true);
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(mapAuthFormError('network', 'sign-in'));
    } finally {
      submitLock.current = false;
      setEmailLoading(false);
    }
  }

  return (
    <AuthShell
      mode="sign-in"
      showCollage
      title="Welcome back"
      subtitle="Sign in to manage your profile, projects, and public CodeCard."
    >
      <div
        className={`transition-opacity duration-150 motion-reduce:transition-none ${
          fadingOut ? 'opacity-90' : 'opacity-100'
        }`}
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-1"
          aria-busy={emailLoading}
          noValidate
        >
          <AuthField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              if (error) setError('');
              if (fieldError.email) setFieldError((prev) => ({ ...prev, email: undefined }));
            }}
            required
            autoComplete="email"
            disabled={authBlocked}
            error={fieldError.email}
          />
          <div>
            <AuthPasswordField
              id="password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (error) setError('');
                if (fieldError.password) setFieldError((prev) => ({ ...prev, password: undefined }));
              }}
              required
              autoComplete="current-password"
              disabled={authBlocked}
              error={fieldError.password}
            />
            <p className="-mt-1 mb-3 text-right">
              <Link
                href="/forgot-password"
                className="text-[13px] font-medium text-[#7a7876] underline-offset-2 hover:text-[#222222] hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </div>

          {resetSuccess ? (
            <p className="mb-3 text-[14px] text-[#2f6f4e]" role="status">
              Your password was updated. Sign in with your new password.
            </p>
          ) : null}

          {statusMessage ? (
            <div className="mb-3">
              <AuthErrorAlert message={statusMessage} />
            </div>
          ) : null}

          <div ref={errorRef} tabIndex={-1} className="mb-3 outline-none">
            <AuthErrorAlert message={error} />
          </div>

          <AuthPrimaryButton
            pending={emailLoading}
            pendingLabel="Signing in…"
            idleLabel="Sign in"
            disabled={authBlocked && !emailLoading}
          />
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[rgba(34,34,34,0.08)]" />
          <span className="cc-app-mono text-[11px] uppercase tracking-[0.08em] text-smoke">or</span>
          <div className="h-px flex-1 bg-[rgba(34,34,34,0.08)]" />
        </div>

        <div aria-busy={oauthLoading !== null}>
          <AuthGithubButton
            label={oauthButtonLabel('github', oauthLoading)}
            onClick={() => void oauthGithub()}
            disabled={authBlocked}
            pending={oauthLoading === 'github'}
          />
        </div>

        <div className="mt-8 border-t border-[rgba(34,34,34,0.08)] pt-6">
          <Link
            href={LIVE_DEMO_HREF}
            className="cc-auth-demo-link"
            title="Explore CodeCard using sample data."
            aria-label="Explore demo workspace — sample data only, not a real account"
          >
            Explore demo workspace
          </Link>
          <p className="mt-2 text-center text-[12px] text-smoke">
            Explore CodeCard using sample data. No account required.
          </p>
        </div>

        <p className="mt-6 text-center text-[14px] text-[#7a7876]">
          No account?{' '}
          <Link
            href="/sign-up"
            className="font-medium text-[#222222] underline-offset-2 hover:underline"
            prefetch
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
