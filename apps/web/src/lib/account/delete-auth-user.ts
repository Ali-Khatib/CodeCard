import type { SupabaseClient } from '@supabase/supabase-js';
import { registerAccountDeletionCapability } from '@/lib/account/delete-capabilities';

/**
 * WS10-T005 — Supabase Auth user deletion (server-only).
 *
 * Must run last in the account-deletion orchestrator after Stripe, storage,
 * local content, analytics anonymization, and deletion audit succeed.
 *
 * Target user id comes only from trusted deletion context (session-derived).
 * Never accept a client-supplied user id or email.
 */

export type TrustedAuthDeletionContext = {
  /** Authenticated session user id — authoritative. */
  authenticatedUserId: string;
  /** Same id resolved from T004 profile/tenant resolution — must match session. */
  trustedOwnerUserId: string;
  /** Durable operation correlation from the account deletion lock. */
  correlationId: string;
  /**
   * When true, a missing Auth user is treated as success only if prior stages
   * of this same deletion operation already completed (retry after Auth success).
   */
  priorStagesCompleted: boolean;
};

export type AuthUserDeletionResult =
  | { ok: true; deleted: boolean; alreadyMissing: boolean }
  | {
      ok: false;
      reason:
        | 'target_mismatch'
        | 'service_role_unavailable'
        | 'admin_error'
        | 'unexpected_missing_user';
    };

export function isAuthUserDeletionConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() && env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function registerAuthUserDeletionCapability(
  env: NodeJS.ProcessEnv = process.env,
): void {
  registerAccountDeletionCapability({
    id: 'auth_user_deletion',
    label: 'Supabase Auth user deletion',
    isAvailable: () => isAuthUserDeletionConfigured(env),
  });
}

function isUserNotFoundAdminError(error: { message?: string; status?: number } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? '').toLowerCase();
  if (error.status === 404) return true;
  return (
    message.includes('user not found') ||
    message.includes('not found') ||
    message.includes('does not exist')
  );
}

/**
 * Sanitize Admin API failures for logs/tests — never return raw Admin payloads to routes.
 */
export function sanitizeAuthAdminError(error: unknown): string {
  void error;
  return 'auth_admin_error';
}

/**
 * Delete the Auth user for a trusted account-deletion context.
 *
 * Uses the service-role Admin API only. Does not list or search users.
 */
export async function deleteTrustedSupabaseAuthUser(
  serviceSupabase: SupabaseClient,
  ctx: TrustedAuthDeletionContext,
): Promise<AuthUserDeletionResult> {
  if (ctx.authenticatedUserId !== ctx.trustedOwnerUserId) {
    return { ok: false, reason: 'target_mismatch' };
  }

  if (!isAuthUserDeletionConfigured()) {
    return { ok: false, reason: 'service_role_unavailable' };
  }

  const targetUserId = ctx.trustedOwnerUserId;

  const { data: existing, error: getError } = await serviceSupabase.auth.admin.getUserById(
    targetUserId,
  );

  if (getError && !isUserNotFoundAdminError(getError)) {
    void sanitizeAuthAdminError(getError);
    return { ok: false, reason: 'admin_error' };
  }

  if (!existing?.user) {
    if (ctx.priorStagesCompleted) {
      return { ok: true, deleted: false, alreadyMissing: true };
    }
    return { ok: false, reason: 'unexpected_missing_user' };
  }

  if (existing.user.id !== targetUserId) {
    return { ok: false, reason: 'target_mismatch' };
  }

  const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(targetUserId);

  if (deleteError) {
    if (isUserNotFoundAdminError(deleteError) && ctx.priorStagesCompleted) {
      return { ok: true, deleted: false, alreadyMissing: true };
    }
    void sanitizeAuthAdminError(deleteError);
    return { ok: false, reason: 'admin_error' };
  }

  return { ok: true, deleted: true, alreadyMissing: false };
}
