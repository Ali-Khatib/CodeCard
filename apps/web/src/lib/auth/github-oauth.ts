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
 * Starts GitHub OAuth with the browser-native Supabase redirect.
 * No server preflight — that was aborting healthy authorize flows.
 */
export async function startGithubOAuth({
  supabase,
  redirectPath = '/dashboard',
}: StartGithubOAuthArgs): Promise<StartGithubOAuthResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: authCallbackRedirectUrl(redirectPath),
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  // With skipBrowserRedirect: false, Supabase navigates immediately when a URL exists.
  if (!data.url) {
    return { ok: false, message: 'oauth_missing_url' };
  }

  return { ok: true };
}
