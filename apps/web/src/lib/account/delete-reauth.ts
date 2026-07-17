import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  ACCOUNT_DELETION_REAUTH_WINDOW_SECONDS,
  type AccountDeletionReauthentication,
} from '@/lib/account/delete-schema';

const OAUTH_PROVIDERS = new Set(['google', 'github', 'gitlab', 'apple', 'azure', 'facebook']);

const INTERACTIVE_AMR_METHODS = new Set([
  'password',
  'oauth',
  'otp',
  'totp',
  'magiclink',
  'email/signup',
  'sso/saml',
  'invite',
]);

export type ReauthVerificationResult =
  | { ok: true; method: AccountDeletionReauthentication['method'] }
  | {
      ok: false;
      reason: 'missing_proof' | 'invalid_password' | 'expired_proof' | 'provider_mismatch' | 'session_missing';
    };

type AmrEntry = { method?: string; timestamp?: number };

function userHasPasswordIdentity(user: User): boolean {
  const identities = user.identities ?? [];
  return identities.some((identity) => identity.provider === 'email');
}

function userIsOAuthOnly(user: User): boolean {
  const identities = user.identities ?? [];
  if (identities.length === 0) {
    const provider = String(user.app_metadata?.provider ?? '');
    return OAUTH_PROVIDERS.has(provider);
  }
  const hasEmail = identities.some((identity) => identity.provider === 'email');
  const hasOAuth = identities.some((identity) => OAUTH_PROVIDERS.has(identity.provider));
  return hasOAuth && !hasEmail;
}

/** Decode JWT payload without verifying — caller must already have verified the session via getUser. */
export function decodeAccessTokenPayload(accessToken: string): Record<string, unknown> | null {
  const parts = accessToken.split('.');
  if (parts.length < 2) return null;
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getLatestInteractiveAmrTimestamp(
  payload: Record<string, unknown> | null,
): number | null {
  if (!payload) return null;
  const amr = payload.amr;
  if (!Array.isArray(amr)) return null;

  let latest: number | null = null;
  for (const entry of amr as AmrEntry[]) {
    if (!entry || typeof entry !== 'object') continue;
    const method = typeof entry.method === 'string' ? entry.method : '';
    if (method === 'token_refresh' || !INTERACTIVE_AMR_METHODS.has(method)) continue;
    const ts = typeof entry.timestamp === 'number' ? entry.timestamp : null;
    if (ts == null || !Number.isFinite(ts)) continue;
    if (latest == null || ts > latest) latest = ts;
  }
  return latest;
}

export function isWithinReauthWindow(
  unixSeconds: number | null,
  nowMs: number = Date.now(),
  windowSeconds: number = ACCOUNT_DELETION_REAUTH_WINDOW_SECONDS,
): boolean {
  if (unixSeconds == null) return false;
  const ageSeconds = nowMs / 1000 - unixSeconds;
  return ageSeconds >= 0 && ageSeconds <= windowSeconds;
}

/**
 * Verify recent reauthentication for account deletion.
 * - password: email/password users prove with current password (never logged).
 * - recent_login: interactive AMR / last_sign_in within the short window (OAuth-safe).
 */
export async function verifyAccountDeletionReauthentication(
  supabase: SupabaseClient,
  user: User,
  proof: AccountDeletionReauthentication,
  options?: { accessToken?: string | null; nowMs?: number },
): Promise<ReauthVerificationResult> {
  if (proof.method === 'password') {
    if (userIsOAuthOnly(user) || !userHasPasswordIdentity(user)) {
      return { ok: false, reason: 'provider_mismatch' };
    }
    if (!user.email) {
      return { ok: false, reason: 'provider_mismatch' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: proof.password,
    });

    if (error || !data.user || data.user.id !== user.id) {
      return { ok: false, reason: 'invalid_password' };
    }

    return { ok: true, method: 'password' };
  }

  // recent_login
  const accessToken = options?.accessToken ?? null;
  if (!accessToken) {
    return { ok: false, reason: 'session_missing' };
  }

  const payload = decodeAccessTokenPayload(accessToken);
  if (!payload) {
    return { ok: false, reason: 'session_missing' };
  }

  const sub = typeof payload.sub === 'string' ? payload.sub : null;
  if (sub && sub !== user.id) {
    return { ok: false, reason: 'expired_proof' };
  }

  const amrTs = getLatestInteractiveAmrTimestamp(payload);
  if (isWithinReauthWindow(amrTs, options?.nowMs)) {
    return { ok: true, method: 'recent_login' };
  }

  // Fallback: last_sign_in_at when AMR is absent (some session shapes).
  const lastSignIn = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : NaN;
  if (!Number.isNaN(lastSignIn)) {
    const unix = Math.floor(lastSignIn / 1000);
    if (isWithinReauthWindow(unix, options?.nowMs)) {
      return { ok: true, method: 'recent_login' };
    }
  }

  return { ok: false, reason: 'expired_proof' };
}
