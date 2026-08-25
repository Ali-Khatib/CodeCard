import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Removes the personal tenant shell left behind by account deletion.
 *
 * `handle_new_user` seeds `tenants.name` from the signup display name and falls
 * back to the email local-part, and `tenants.slug` is derived from the same
 * source. Deleting the profile and Auth user therefore still left an identifying
 * row behind, and the slug stayed permanently reserved.
 *
 * Safe to run last: every tenant-scoped content table declares
 * `tenant_id ... REFERENCES tenants(id) ON DELETE CASCADE`, while the records
 * deletion intentionally preserves (`audit_logs`, `billing_events`, `jobs`,
 * `moderation_reports`) carry a plain `tenant_id uuid` with no foreign key, so
 * they are untouched by this delete. In particular the queued storage-cleanup
 * job survives.
 *
 * Only ever called for a sole-member personal tenant, which the orchestrator
 * asserts before any destructive stage.
 */

export type TrustedTenantShellDeletionContext = {
  /** Authenticated session user id — authoritative. */
  authenticatedUserId: string;
  /** Same id resolved during profile/tenant resolution; must match the session. */
  trustedOwnerUserId: string;
  /** Tenant resolved from the owner's profile — never client-supplied. */
  tenantId: string;
  correlationId: string;
};

export type TenantShellDeletionResult =
  | { ok: true; deleted: boolean }
  | { ok: false; reason: 'target_mismatch' | 'members_remain' | 'delete_failed' };

/**
 * Deletes the tenant row once its last membership is gone.
 *
 * Runs after Auth user deletion, whose `tenant_memberships` cascade removes the
 * final membership. If any membership still exists the tenant is shared and is
 * left alone.
 */
export async function deleteTrustedTenantShell(
  serviceSupabase: SupabaseClient,
  ctx: TrustedTenantShellDeletionContext,
): Promise<TenantShellDeletionResult> {
  if (ctx.authenticatedUserId !== ctx.trustedOwnerUserId) {
    return { ok: false, reason: 'target_mismatch' };
  }

  const { count, error: countError } = await serviceSupabase
    .from('tenant_memberships')
    .select('user_id', { count: 'exact', head: true })
    .eq('tenant_id', ctx.tenantId);

  if (countError) {
    return { ok: false, reason: 'delete_failed' };
  }

  /* A surviving membership means this tenant is not a personal shell. */
  if ((count ?? 0) > 0) {
    return { ok: false, reason: 'members_remain' };
  }

  const { error: deleteError } = await serviceSupabase
    .from('tenants')
    .delete()
    .eq('id', ctx.tenantId);

  if (deleteError) {
    return { ok: false, reason: 'delete_failed' };
  }

  return { ok: true, deleted: true };
}
