import 'server-only';

import { forbidden, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInternalRedirect } from '@/lib/auth/redirect';
import {
  resolveGlobalAdminAuthorization,
  type AdminAuthorizationDecision,
} from '@/lib/security/admin-authorization';

/**
 * WS11-T002 — Server-side route gate for the `/admin` tree.
 *
 * Thin enforcement wrapper around the single canonical WS13-T001 resolver
 * (`resolveGlobalAdminAuthorization`). It introduces no second role source.
 *
 * Contract (docs/ADMIN_AUTHORIZATION.md §16):
 * - anonymous / missing session → redirect to /sign-in (same as middleware)
 * - authenticated non-admin, demo, malformed/misconfigured claim,
 *   identity-provider failure → fail closed with a real 403 (`forbidden()`)
 * - global admin → render continues
 *
 * Must be awaited BEFORE any admin rendering or data fetching. Next.js renders
 * layouts and pages in parallel, so every admin page must call this itself in
 * addition to the shared `/admin` layout.
 *
 * Page authorization is NOT API authorization — later admin APIs must re-check
 * via the canonical resolver server-side (WS13-T002).
 */

const SIGN_IN_REDIRECT = `/sign-in?redirect=${encodeURIComponent(
  sanitizeInternalRedirect('/admin'),
)}`;

type VerifiedUser = { id: string; app_metadata?: Record<string, unknown> };

function isMissingSessionError(error: { name?: string } | null | undefined): boolean {
  return error?.name === 'AuthSessionMissingError';
}

export async function enforceGlobalAdminAccess(): Promise<AdminAuthorizationDecision> {
  let user: VerifiedUser | null = null;
  let redirectToSignIn = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isMissingSessionError(error)) {
        redirectToSignIn = true;
      } else {
        // Identity provider failure or unverifiable session — fail closed.
        // Bounded, redacted diagnostic only (no tokens, metadata, or user IDs).
        console.error('[admin-gate] identity verification failed; failing closed');
        forbidden();
      }
    } else {
      user = data.user;
    }
  } catch (error) {
    // Re-throw Next.js control-flow errors (forbidden/redirect) untouched.
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    console.error('[admin-gate] identity provider unavailable; failing closed');
    forbidden();
  }

  if (redirectToSignIn || !user) {
    redirect(SIGN_IN_REDIRECT);
  }

  const decision = resolveGlobalAdminAuthorization({
    userId: user.id,
    appMetadata: user.app_metadata ?? null,
  });

  if (!decision.authorized) {
    if (decision.reason === 'unauthenticated') {
      redirect(SIGN_IN_REDIRECT);
    }
    if (decision.reason === 'misconfigured') {
      console.error('[admin-gate] authorization misconfigured; failing closed');
    }
    forbidden();
  }

  return decision;
}
