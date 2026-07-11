'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';
import { signInSchema } from '@codecard/validation';
import { AuthShell } from '@/components/auth/auth-shell';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';

const SETUP_MSG =
  'Add Supabase keys to apps/web/.env.local (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).';

function OAuthButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cc-btn-pill-ghost w-full py-2.5 text-[15px] disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';
  const resetSuccess = searchParams.get('reset') === 'success';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authConfigured = isSupabasePublicKeyConfigured();

  async function oauth(provider: 'google' | 'github') {
    if (!authConfigured) {
      setError(SETUP_MSG);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!authConfigured) {
      setError(SETUP_MSG);
      return;
    }

    setLoading(true);

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid input');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <AuthShell
      title="Sign in to CodeCard"
      subtitle="Manage your projects, profile, analytics, and connections."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-[14px] font-medium text-[#222222]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="cc-input w-full"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-[14px] font-medium text-[#222222]">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="cc-input w-full"
          />
          <p className="text-right">
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-[#7a7876] underline-offset-2 hover:text-[#222222] hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        </div>
        {resetSuccess && (
          <p className="text-[14px] text-[#2f6f4e]" role="status">
            Your password was updated. Sign in with your new password.
          </p>
        )}
        {error && <p className="text-[14px] text-[#df6a6b]">{error}</p>}
        <button
          type="submit"
          className="cc-btn-pill-primary w-full py-2.5 text-[15px]"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[rgba(34,34,34,0.08)]" />
        <span className="cc-app-mono">or</span>
        <div className="h-px flex-1 bg-[rgba(34,34,34,0.08)]" />
      </div>

      <div className="space-y-3">
        <OAuthButton label="Continue with GitHub" onClick={() => oauth('github')} disabled={loading} />
        <OAuthButton label="Continue with Google" onClick={() => oauth('google')} disabled={loading} />
      </div>

      <div className="mt-8 border-t border-[rgba(34,34,34,0.08)] pt-6">
        <Link href={LIVE_DEMO_HREF} className="cc-btn-pill-ghost flex w-full justify-center py-2.5 text-[15px]">
          Explore demo workspace
        </Link>
      </div>

      <p className="mt-6 text-center text-[14px] text-[#7a7876]">
        No account?{' '}
        <Link href="/sign-up" className="font-medium text-[#222222] underline-offset-2 hover:underline">
          Create one
        </Link>
      </p>
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
