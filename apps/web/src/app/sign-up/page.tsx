'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';
import { signUpSchema } from '@codecard/validation';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthField } from '@/components/auth/auth-field';
import { AuthPasswordField } from '@/components/auth/auth-password-field';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { AuthErrorAlert } from '@/components/auth/auth-error-alert';
import { authCallbackRedirectUrl } from '@/lib/auth/redirect';
import { mapAuthFormError } from '@/lib/auth/map-auth-form-error';
import {
  SIGNUP_CONFIRMATION_TITLE,
  resolveSignUpOutcome,
  signupConfirmationBody,
} from '@/lib/auth/signup-result';

const SETUP_MSG =
  'Sign-up needs Supabase. Copy apps/web/.env.example to .env.local and add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    email: searchParams.get('email') ?? '',
    password: '',
    display_name: '',
    slug: '',
  });
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [loading, setLoading] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const submitLock = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const authConfigured = isSupabasePublicKeyConfigured();

  useEffect(() => {
    router.prefetch('/sign-in');
  }, [router]);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'display_name' && !prev.slug) {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      return next;
    });
    if (error) setError('');
    if (fieldError[field]) {
      setFieldError((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldError({});

    if (submitLock.current || loading || pendingConfirmationEmail) return;

    if (!authConfigured) {
      setError(SETUP_MSG);
      return;
    }

    submitLock.current = true;
    setLoading(true);

    try {
      const parsed = signUpSchema.safeParse(form);
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        const message = first?.message ?? 'Invalid input';
        const path = first?.path?.[0];
        if (
          path === 'email' ||
          path === 'password' ||
          path === 'display_name' ||
          path === 'slug'
        ) {
          setFieldError({ [path]: message });
        } else {
          setError(mapAuthFormError(message, 'sign-up'));
        }
        return;
      }

      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: authCallbackRedirectUrl('/dashboard'),
          data: {
            display_name: parsed.data.display_name,
            slug: parsed.data.slug,
          },
        },
      });

      const outcome = resolveSignUpOutcome({
        data: { user: data.user, session: data.session },
        error: authError,
        email: parsed.data.email,
      });

      if (outcome.kind === 'error') {
        setError(outcome.message);
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }

      if (outcome.kind === 'needs_email_confirmation') {
        setPendingConfirmationEmail(outcome.email);
        return;
      }

      setFadingOut(true);
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError(mapAuthFormError('network', 'sign-up'));
    } finally {
      submitLock.current = false;
      setLoading(false);
    }
  }

  if (pendingConfirmationEmail) {
    return (
      <AuthShell
        mode="sign-up"
        showCollage
        title={SIGNUP_CONFIRMATION_TITLE}
        subtitle={signupConfirmationBody(pendingConfirmationEmail)}
      >
        <div className="space-y-4" role="status" aria-live="polite" data-testid="signup-email-confirmation">
          <p className="text-[14px] leading-relaxed text-smoke">
            Open the confirmation link in that email to activate your account. Until then you cannot
            open the dashboard.
          </p>
          <Link
            href="/sign-in"
            className="cc-btn-pill-primary flex w-full justify-center py-2.5 text-[15px]"
            prefetch
          >
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      mode="sign-up"
      showCollage
      title="Create your account"
      subtitle="Set up your public CodeCard and start adding projects."
    >
      <div
        className={`transition-opacity duration-150 motion-reduce:transition-none ${
          fadingOut ? 'opacity-90' : 'opacity-100'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-1" aria-busy={loading} noValidate>
          <AuthField
            id="display_name"
            label="Display name"
            value={form.display_name}
            onChange={(value) => update('display_name', value)}
            required={authConfigured}
            autoComplete="name"
            disabled={loading}
            error={fieldError.display_name}
          />
          <AuthField
            id="slug"
            label="Profile URL"
            value={form.slug}
            onChange={(value) => update('slug', value.toLowerCase())}
            required={authConfigured}
            autoComplete="username"
            disabled={loading}
            pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
            prefix="codecard.app/"
            error={fieldError.slug}
          />
          <AuthField
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => update('email', value)}
            required={authConfigured}
            autoComplete="email"
            disabled={loading}
            error={fieldError.email}
          />
          <AuthPasswordField
            id="password"
            value={form.password}
            onChange={(value) => update('password', value)}
            required={authConfigured}
            autoComplete="new-password"
            disabled={loading}
            showGuidance
            error={fieldError.password}
          />

          <div ref={errorRef} tabIndex={-1} className="mb-3 outline-none">
            <AuthErrorAlert message={error} />
          </div>

          {!authConfigured && !error ? (
            <p className="mb-3 text-[13px] leading-relaxed text-smoke">{SETUP_MSG}</p>
          ) : null}

          <AuthPrimaryButton
            pending={loading}
            pendingLabel="Creating account…"
            idleLabel="Create account"
            disabled={loading}
          />
        </form>

        <p className="mt-6 text-center text-[14px] text-smoke">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-ink underline-offset-2 hover:underline"
            prefetch
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
