'use client';

import { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';
import { signUpSchema } from '@codecard/validation';
import { AuthShell } from '@/components/auth/auth-shell';
import { authCallbackRedirectUrl } from '@/lib/auth/redirect';

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
  const [loading, setLoading] = useState(false);
  const submitLock = useRef(false);

  const authConfigured = isSupabasePublicKeyConfigured();

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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (submitLock.current || loading) return;

    if (!authConfigured) {
      setError(SETUP_MSG);
      return;
    }

    submitLock.current = true;
    setLoading(true);

    try {
      const parsed = signUpSchema.safeParse(form);
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? 'Invalid input');
        return;
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
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

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Could not create your account. Please try again.');
    } finally {
      submitLock.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your CodeCard"
      subtitle="Build your first profile in under five minutes."
    >
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div className="space-y-2">
          <label htmlFor="display_name" className="text-[13px] font-medium text-graphite">
            Display name
          </label>
          <input
            id="display_name"
            value={form.display_name}
            onChange={(e) => update('display_name', e.target.value)}
            required={authConfigured}
            className="cc-input w-full"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="slug" className="text-[13px] font-medium text-graphite">
            Profile URL
          </label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-graphite">codecard.app/</span>
            <input
              id="slug"
              value={form.slug}
              onChange={(e) => update('slug', e.target.value.toLowerCase())}
              required={authConfigured}
              pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
              className="cc-input w-full"
              disabled={loading}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-[13px] font-medium text-graphite">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required={authConfigured}
            autoComplete="email"
            className="cc-input w-full"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-[13px] font-medium text-graphite">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required={authConfigured}
            autoComplete="new-password"
            className="cc-input w-full"
            disabled={loading}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {!authConfigured && !error && (
          <p className="text-[13px] leading-relaxed text-graphite">{SETUP_MSG}</p>
        )}
        <button
          type="submit"
          className="cc-btn-pill-primary w-full py-2.5 text-[15px]"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-graphite">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-reactor hover:text-phosphor">
          Sign in
        </Link>
      </p>
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
