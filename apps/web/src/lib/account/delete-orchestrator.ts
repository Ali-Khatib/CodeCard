import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  evaluateAccountDeletionReadiness,
  registerT004ScaffoldCapabilities,
  type AccountDeletionCapabilityId,
} from '@/lib/account/delete-capabilities';
import { registerAuthUserDeletionCapability } from '@/lib/account/delete-auth-user';
import { registerStripeCancellationCapability } from '@/lib/account/delete-stripe';
import type { AccountDeletionErrorCode } from '@/lib/account/delete-schema';
import { assertPersonalTenantSoleMember } from '@/lib/account/delete-local-content';

export const ACCOUNT_DELETION_INTENDED_ORDER = [
  'validate_auth_reauth_confirmation',
  'validate_capabilities',
  'acquire_deletion_lock',
  'resolve_account_and_external_state',
  'cancel_stripe_or_verify_no_subscription',
  'capture_storage_targets_and_enqueue_cleanup',
  'delete_approved_local_content',
  'anonymize_or_delete_analytics',
  'insert_immutable_deletion_audit',
  'delete_supabase_auth_user_last',
  'return_success',
] as const;

export type AccountDeletionOrchestratorResult =
  | {
      ok: false;
      code: AccountDeletionErrorCode;
      missingCapabilities?: AccountDeletionCapabilityId[];
      /** True when zero database/storage/billing/auth mutations occurred. */
      mutated: false;
    }
  | {
      ok: true;
      /** Only reachable when all capabilities are registered and stages succeed. */
      mutated: true;
    };

export function ensureT004CapabilityScaffoldsRegistered(): void {
  // Idempotent: registering twice overwrites the same ids safely.
  registerT004ScaffoldCapabilities();
  // WS10-T005 / T006: real capabilities (still insufficient alone — T007–T008 required).
  registerAuthUserDeletionCapability();
  registerStripeCancellationCapability();
}

/**
 * Account deletion orchestrator (WS10-T004).
 *
 * While T007–T008 capabilities are unavailable, returns ACCOUNT_DELETION_NOT_READY
 * before any lock acquisition or mutation. T005–T006 register real capabilities but
 * are insufficient alone; Auth remains the final stage when the full pipeline runs.
 */
export async function runAccountDeletionOrchestrator(input: {
  user: User;
  supabase: SupabaseClient;
  /** Optional service client factory — unused while not ready. */
  createServiceClient?: () => Promise<SupabaseClient>;
}): Promise<AccountDeletionOrchestratorResult> {
  ensureT004CapabilityScaffoldsRegistered();

  const readiness = evaluateAccountDeletionReadiness();
  if (!readiness.ready) {
    return {
      ok: false,
      code: 'ACCOUNT_DELETION_NOT_READY',
      missingCapabilities: readiness.missing,
      mutated: false,
    };
  }

  // --- Paths below are unreachable until T007–T008 register real capabilities. ---
  // Kept for ordered future execution; must never run with placeholder successes.

  const { data: profile, error: profileError } = await input.supabase
    .from('profiles')
    .select('id, tenant_id, owner_user_id')
    .eq('owner_user_id', input.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
  }

  const tenantCheck = await assertPersonalTenantSoleMember(input.supabase, profile.tenant_id);
  if (!tenantCheck.ok) {
    if (tenantCheck.reason === 'shared_tenant') {
      return { ok: false, code: 'SHARED_TENANT_BLOCKED', mutated: false };
    }
    return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
  }

  // Future stages (lock → Stripe → storage → local → analytics → audit → Auth) are
  // intentionally not invoked until T007–T008 wire remaining stages. Fail closed.
  return {
    ok: false,
    code: 'ACCOUNT_DELETION_NOT_READY',
    mutated: false,
  };
}

/** Exported for tests — capabilities still required after T005–T006 before mutation is allowed. */
export const ACCOUNT_DELETION_DEFERRED_CAPABILITIES: AccountDeletionCapabilityId[] = [
  'analytics_anonymization',
  'deletion_audit',
];
