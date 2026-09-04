import type { SupabaseClient } from '@supabase/supabase-js';
import { authCallbackRedirectUrl } from '@/lib/auth/redirect';

export const GITHUB_PROVIDER_DISABLED_MESSAGE =
  'GitHub sign-in is not enabled yet. Use email for now, or ask the project owner to turn on GitHub under Supabase → Authentication → Providers.';

/** Minimum GitHub scopes for sign-in. Do not request repo or org access. */
export const GITHUB_OAUTH_SCOPES = 'read:user user:email';

export const GITHUB_LAST_IDENTITY_MESSAGE =
  'Add a password before disconnecting GitHub so you can still sign in.';

export const GITHUB_NOT_CONNECTED_MESSAGE = 'GitHub is not connected to this account.';

type GithubIdentity = { provider?: string };

export function hasGithubIdentity(identities: GithubIdentity[] | null | undefined): boolean {
  return (identities ?? []).some((identity) => identity.provider === 'github');
}

export function canDisconnectGithub(identities: GithubIdentity[] | null | undefined): boolean {
  const list = identities ?? [];
  return hasGithubIdentity(list) && list.length >= 2;
}

export function findGithubIdentity<T extends GithubIdentity>(
  identities: T[] | null | undefined,
): T | undefined {
  return (identities ?? []).find((identity) => identity.provider === 'github');
}

type GithubOAuthArgs = {
  supabase: SupabaseClient;
  /** Internal path after callback (e.g. /dashboard). */
  redirectPath?: string;
};

type GithubOAuthResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Starts GitHub OAuth with the browser-native Supabase redirect.
 * No server preflight — that was aborting healthy authorize flows.
 */
export async function startGithubOAuth({
  supabase,
  redirectPath = '/dashboard',
}: GithubOAuthArgs): Promise<GithubOAuthResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: authCallbackRedirectUrl(redirectPath),
      scopes: GITHUB_OAUTH_SCOPES,
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

/** Link GitHub to an already-authenticated account. */
export async function linkGithubIdentity({
  supabase,
  redirectPath = '/dashboard/settings',
}: GithubOAuthArgs): Promise<GithubOAuthResult> {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'github',
    options: {
      redirectTo: authCallbackRedirectUrl(redirectPath),
      scopes: GITHUB_OAUTH_SCOPES,
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data.url) {
    return { ok: false, message: 'oauth_missing_url' };
  }

  return { ok: true };
}
