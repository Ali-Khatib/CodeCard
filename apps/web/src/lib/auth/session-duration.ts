/**
 * Auth session timing for CodeCard.
 * Access tokens last one hour; the Supabase client refreshes them in the background
 * so users stay signed in until they sign out or the refresh token is revoked.
 */
export const AUTH_ACCESS_TOKEN_SECONDS = 3600;

/** Human-readable label for support / UI copy. */
export const AUTH_ACCESS_TOKEN_LABEL = '1 hour';
