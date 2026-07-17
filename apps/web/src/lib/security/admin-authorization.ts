import 'server-only';

/**
 * WS13-T001 — Canonical global CodeCard platform-admin authorization resolver.
 *
 * Source of truth: Supabase Auth `app_metadata.role === "admin"` (exact, case-sensitive).
 * This module is not wired into `/admin` or admin APIs yet (WS11-T002 / WS13-T002).
 *
 * See docs/ADMIN_AUTHORIZATION.md.
 */

/** Exact canonical global platform-admin role value in `app_metadata.role`. */
export const GLOBAL_ADMIN_APP_METADATA_ROLE = 'admin' as const;

/** Canonical claim path on the authenticated identity. */
export const GLOBAL_ADMIN_CLAIM_PATH = 'app_metadata.role' as const;

export type GlobalAdminAuthorizedDecision = {
  authorized: true;
  reason: 'global_admin';
};

export type GlobalAdminDeniedDecision = {
  authorized: false;
  reason:
    | 'unauthenticated'
    | 'not_admin'
    | 'misconfigured'
    | 'demo_identity';
};

export type AdminAuthorizationDecision =
  | GlobalAdminAuthorizedDecision
  | GlobalAdminDeniedDecision;

/**
 * Trusted identity snapshot for authorization.
 *
 * Callers must populate this only from server-verified Auth (`getUser()` / Admin API),
 * never from request bodies, headers, cookies, or client-supplied role claims.
 *
 * Intentionally omitted (never authorize from):
 * - user-controlled Auth metadata (profile / signup editable claims)
 * - tenant membership roles
 * - caller-supplied role fields
 * - environment email allowlists
 * - service-role key possession
 */
export type TrustedAdminIdentity = {
  /** Authenticated user id from server-side Auth. Null/empty → unauthenticated. */
  userId: string | null | undefined;
  /**
   * Server-verified `user.app_metadata` only.
   * Ordinary profile/signup flows must not write the admin claim here.
   */
  appMetadata?: Record<string, unknown> | null;
  /**
   * When true, the identity is a demo / preview / static marketing identity.
   * Demo identities can never be global platform administrators.
   */
  isDemoIdentity?: boolean;
};

/**
 * Resolve whether a trusted authenticated identity is a global CodeCard platform admin.
 *
 * Fail-closed: unknown shapes, wrong case, arrays, and non-string roles are denied.
 */
export function resolveGlobalAdminAuthorization(
  identity: TrustedAdminIdentity | null | undefined,
): AdminAuthorizationDecision {
  if (!identity) {
    return { authorized: false, reason: 'unauthenticated' };
  }

  const userId = typeof identity.userId === 'string' ? identity.userId.trim() : '';
  if (!userId) {
    return { authorized: false, reason: 'unauthenticated' };
  }

  if (identity.isDemoIdentity === true) {
    return { authorized: false, reason: 'demo_identity' };
  }

  const appMetadata = identity.appMetadata;
  if (appMetadata == null) {
    return { authorized: false, reason: 'not_admin' };
  }

  if (typeof appMetadata !== 'object' || Array.isArray(appMetadata)) {
    return { authorized: false, reason: 'misconfigured' };
  }

  if (!Object.prototype.hasOwnProperty.call(appMetadata, 'role')) {
    return { authorized: false, reason: 'not_admin' };
  }

  const role = appMetadata.role;

  if (role === null || role === undefined) {
    return { authorized: false, reason: 'not_admin' };
  }

  if (typeof role !== 'string') {
    // Arrays (`roles`), numbers, objects, booleans → fail closed as misconfigured.
    return { authorized: false, reason: 'misconfigured' };
  }

  if (role === GLOBAL_ADMIN_APP_METADATA_ROLE) {
    return { authorized: true, reason: 'global_admin' };
  }

  return { authorized: false, reason: 'not_admin' };
}

/** Convenience predicate for later gates; prefer the structured decision in APIs. */
export function isGlobalAdminAuthorized(
  identity: TrustedAdminIdentity | null | undefined,
): boolean {
  return resolveGlobalAdminAuthorization(identity).authorized;
}
