import type { SupabaseClient } from '@supabase/supabase-js';
import { authCallbackRedirectUrl } from '@/lib/auth/redirect';

export const GITHUB_PROVIDER_DISABLED_MESSAGE =
  'GitHub sign-in is not enabled yet. Use email for now, or ask the project owner to turn on GitHub under Supabase → Authentication → Providers.';

type StartGithubOAuthArgs = {
  supabase: SupabaseClient;
  /** Internal path after callback (e.g. /dashboard). */
  redirectPath?: string;
};

type StartGithubOAuthResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Starts GitHub OAuth with a server preflight so a disabled provider
 * shows an in-app error instead of a raw Supabase JSON page.
 */
export async function startGithubOAuth({
  supabase,
  redirectPath = '/dashboard',
}: StartGithubOAuthArgs): Promise<StartGithubOAuthResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: authCallbackRedirectUrl(redirectPath),
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const authorizeUrl = data.url;
  if (!authorizeUrl) {
    return { ok: false, message: 'oauth_missing_url' };
  }

  try {
    const preflight = await fetch('/api/auth/oauth-preflight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: authorizeUrl }),
    });
    const payload = (await preflight.json()) as {
      ok?: boolean;
      reason?: string;
    };

    if (!payload.ok) {
      if (payload.reason === 'provider_disabled') {
        return { ok: false, message: 'provider is not enabled' };
      }
      return { ok: false, message: payload.reason ?? 'oauth_failed' };
    }
  } catch {
    // If preflight is unreachable, fall through to the normal redirect.
  }

  window.location.assign(authorizeUrl);
  return { ok: true };
}
