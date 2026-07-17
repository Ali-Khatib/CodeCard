import type { SupabaseClient } from '@supabase/supabase-js';
import { registerAccountDeletionCapability } from '@/lib/account/delete-capabilities';

/**
 * WS10-T008 — Immutable privacy-safe deletion audit (server-only).
 *
 * Inserted after Stripe, storage/local content, and analytics stages succeed,
 * and before Supabase Auth user deletion.
 */

export const ACCOUNT_DELETION_AUDIT_ACTION = 'account.deleted' as const;
export const ACCOUNT_DELETION_AUDIT_RESOURCE_TYPE = 'account' as const;
export const ACCOUNT_DELETION_POLICY_VERSION = 'ws10-t001-v1' as const;
export const ACCOUNT_DELETION_AUDIT_SCHEMA_VERSION = 'ws10-t008-v1' as const;

export type TrustedDeletionAuditContext = {
  authenticatedUserId: string;
  trustedOwnerUserId: string;
  correlationId: string;
  completionState: 'pre_auth_deletion';
};

export type DeletionAuditResult =
  | { ok: true; inserted: boolean; auditId: string | null }
  | {
      ok: false;
      reason: 'target_mismatch' | 'service_unavailable' | 'insert_failed' | 'unsafe_metadata';
    };

export type DeletionAuditMetadata = {
  policy_version: typeof ACCOUNT_DELETION_POLICY_VERSION;
  schema_version: typeof ACCOUNT_DELETION_AUDIT_SCHEMA_VERSION;
  correlation_id: string;
  completion_state: 'pre_auth_deletion';
};

const FORBIDDEN_METADATA_KEYS = [
  'email',
  'name',
  'display_name',
  'slug',
  'user_id',
  'owner_user_id',
  'profile_id',
  'stripe_customer_id',
  'stripe_subscription_id',
  'storage_path',
  'filename',
  'password',
  'reauthentication',
  'error',
  'raw_error',
] as const;

export function isDeletionAuditConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() && env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function registerDeletionAuditCapability(env: NodeJS.ProcessEnv = process.env): void {
  registerAccountDeletionCapability({
    id: 'deletion_audit',
    label: 'Immutable deletion audit logging',
    isAvailable: () => isDeletionAuditConfigured(env),
  });
}

export function buildDeletionAuditMetadata(
  correlationId: string,
): DeletionAuditMetadata {
  return {
    policy_version: ACCOUNT_DELETION_POLICY_VERSION,
    schema_version: ACCOUNT_DELETION_AUDIT_SCHEMA_VERSION,
    correlation_id: correlationId,
    completion_state: 'pre_auth_deletion',
  };
}

export function assertDeletionAuditMetadataSafe(
  metadata: Record<string, unknown>,
): { ok: true } | { ok: false } {
  for (const key of Object.keys(metadata)) {
    if ((FORBIDDEN_METADATA_KEYS as readonly string[]).includes(key)) {
      return { ok: false };
    }
  }
  const serialized = JSON.stringify(metadata).toLowerCase();
  if (
    serialized.includes('@') ||
    serialized.includes('stripe_') ||
    serialized.includes('sk_') ||
    serialized.includes('cus_') ||
    serialized.includes('sub_')
  ) {
    return { ok: false };
  }
  return { ok: true };
}

/**
 * Insert a privacy-safe account.deleted audit row.
 * Retries with the same correlation_id reuse the existing row (no duplicates).
 */
export async function insertTrustedDeletionAudit(
  serviceSupabase: SupabaseClient,
  ctx: TrustedDeletionAuditContext,
): Promise<DeletionAuditResult> {
  if (ctx.authenticatedUserId !== ctx.trustedOwnerUserId) {
    return { ok: false, reason: 'target_mismatch' };
  }

  if (!isDeletionAuditConfigured()) {
    return { ok: false, reason: 'service_unavailable' };
  }

  const metadata = buildDeletionAuditMetadata(ctx.correlationId);
  if (!assertDeletionAuditMetadataSafe(metadata as unknown as Record<string, unknown>).ok) {
    return { ok: false, reason: 'unsafe_metadata' };
  }

  const { data: existing, error: existingError } = await serviceSupabase
    .from('audit_logs')
    .select('id, metadata, action, actor_user_id, tenant_id')
    .eq('action', ACCOUNT_DELETION_AUDIT_ACTION)
    .contains('metadata', { correlation_id: ctx.correlationId })
    .maybeSingle();

  if (existingError) {
    // Some PostgREST versions may not support contains the same way — fall through to insert
    // and rely on unique index for dedupe when select filter is unavailable.
  }

  if (existing?.id) {
    return { ok: true, inserted: false, auditId: existing.id as string };
  }

  const { data, error } = await serviceSupabase
    .from('audit_logs')
    .insert({
      tenant_id: null,
      actor_user_id: null,
      action: ACCOUNT_DELETION_AUDIT_ACTION,
      resource_type: ACCOUNT_DELETION_AUDIT_RESOURCE_TYPE,
      resource_id: null,
      metadata,
    })
    .select('id')
    .single();

  if (error) {
    const message = (error.message ?? '').toLowerCase();
    if (message.includes('duplicate') || message.includes('unique')) {
      const { data: raced } = await serviceSupabase
        .from('audit_logs')
        .select('id')
        .eq('action', ACCOUNT_DELETION_AUDIT_ACTION)
        .contains('metadata', { correlation_id: ctx.correlationId })
        .maybeSingle();
      if (raced?.id) {
        return { ok: true, inserted: false, auditId: raced.id as string };
      }
    }
    return { ok: false, reason: 'insert_failed' };
  }

  if (!data?.id) {
    return { ok: false, reason: 'insert_failed' };
  }

  return { ok: true, inserted: true, auditId: data.id as string };
}
