import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  evaluateAccountDeletionReadiness,
  registerT004ScaffoldCapabilities,
  type AccountDeletionCapabilityId,
} from '@/lib/account/delete-capabilities';
import {
  deleteTrustedSupabaseAuthUser,
  registerAuthUserDeletionCapability,
} from '@/lib/account/delete-auth-user';
import {
  cancelTrustedAccountStripeSubscription,
  registerStripeCancellationCapability,
} from '@/lib/account/delete-stripe';
import {
  anonymizeTrustedAccountAnalytics,
  registerAnalyticsAnonymizationCapability,
} from '@/lib/account/delete-analytics';
import {
  insertTrustedDeletionAudit,
  registerDeletionAuditCapability,
} from '@/lib/account/delete-audit';
import type { AccountDeletionErrorCode } from '@/lib/account/delete-schema';
import {
  assertPersonalTenantSoleMember,
  executeLocalAccountContentDeletion,
} from '@/lib/account/delete-local-content';
import {
  acquireAccountDeletionLock,
  releaseAccountDeletionLock,
} from '@/lib/account/delete-lock';
import { getStripe } from '@/lib/stripe';

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

export type AccountDeletionOrchestratorDeps = {
  createServiceClient: () => Promise<SupabaseClient>;
  getStripeClient?: () => ReturnType<typeof getStripe>;
};

export function ensureAccountDeletionCapabilitiesRegistered(): void {
  registerT004ScaffoldCapabilities();
  registerAuthUserDeletionCapability();
  registerStripeCancellationCapability();
  registerAnalyticsAnonymizationCapability();
  registerDeletionAuditCapability();
}

/** @deprecated Use ensureAccountDeletionCapabilitiesRegistered */
export function ensureT004CapabilityScaffoldsRegistered(): void {
  ensureAccountDeletionCapabilitiesRegistered();
}

/**
 * Account deletion orchestrator (WS10-T004–T008).
 *
 * Runtime order (Auth last):
 * readiness → resolve → lock → Stripe → storage/local → analytics → audit → Auth → success
 */
export async function runAccountDeletionOrchestrator(input: {
  user: User;
  supabase: SupabaseClient;
  createServiceClient?: () => Promise<SupabaseClient>;
  getStripeClient?: () => ReturnType<typeof getStripe>;
}): Promise<AccountDeletionOrchestratorResult> {
  ensureAccountDeletionCapabilitiesRegistered();

  const readiness = evaluateAccountDeletionReadiness();
  if (!readiness.ready) {
    return {
      ok: false,
      code: 'ACCOUNT_DELETION_NOT_READY',
      missingCapabilities: readiness.missing,
      mutated: false,
    };
  }

  if (!input.createServiceClient) {
    return {
      ok: false,
      code: 'ACCOUNT_DELETION_NOT_READY',
      mutated: false,
    };
  }

  const { data: profile, error: profileError } = await input.supabase
    .from('profiles')
    .select('id, tenant_id, owner_user_id')
    .eq('owner_user_id', input.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
  }

  if (profile.owner_user_id !== input.user.id) {
    return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
  }

  const tenantCheck = await assertPersonalTenantSoleMember(input.supabase, profile.tenant_id);
  if (!tenantCheck.ok) {
    if (tenantCheck.reason === 'shared_tenant') {
      return { ok: false, code: 'SHARED_TENANT_BLOCKED', mutated: false };
    }
    return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
  }

  let service: SupabaseClient;
  try {
    service = await input.createServiceClient();
  } catch {
    return {
      ok: false,
      code: 'ACCOUNT_DELETION_NOT_READY',
      mutated: false,
    };
  }

  const lock = await acquireAccountDeletionLock(service, input.user.id);
  if (!lock.ok) {
    if (lock.reason === 'in_progress') {
      return { ok: false, code: 'ACCOUNT_DELETION_IN_PROGRESS', mutated: false };
    }
    return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
  }

  const trustedOwnerUserId = input.user.id;
  const tenantId = profile.tenant_id as string;
  const profileId = profile.id as string;
  const correlationId = lock.correlationId;

  try {
    let stripeClient: ReturnType<typeof getStripe>;
    try {
      stripeClient = (input.getStripeClient ?? getStripe)();
    } catch {
      await releaseAccountDeletionLock(service, lock.operationId, 'failed', 'stripe_unavailable');
      return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
    }

    const stripeResult = await cancelTrustedAccountStripeSubscription(service, stripeClient, {
      authenticatedUserId: trustedOwnerUserId,
      trustedOwnerUserId,
      tenantId,
      correlationId,
    });
    if (!stripeResult.ok) {
      await releaseAccountDeletionLock(service, lock.operationId, 'failed', 'stripe_cancellation');
      return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
    }

    const localResult = await executeLocalAccountContentDeletion(input.supabase, service, {
      ownerUserId: trustedOwnerUserId,
      tenantId,
      profileId,
    });
    if (!localResult.ok) {
      await releaseAccountDeletionLock(service, lock.operationId, 'failed', 'local_content');
      return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
    }

    const analyticsResult = await anonymizeTrustedAccountAnalytics(service, {
      authenticatedUserId: trustedOwnerUserId,
      trustedOwnerUserId,
      tenantId,
      profileId,
      correlationId,
    });
    if (!analyticsResult.ok) {
      await releaseAccountDeletionLock(service, lock.operationId, 'failed', 'analytics');
      return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
    }

    const auditResult = await insertTrustedDeletionAudit(service, {
      authenticatedUserId: trustedOwnerUserId,
      trustedOwnerUserId,
      correlationId,
      completionState: 'pre_auth_deletion',
    });
    if (!auditResult.ok) {
      await releaseAccountDeletionLock(service, lock.operationId, 'failed', 'deletion_audit');
      return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
    }

    const authResult = await deleteTrustedSupabaseAuthUser(service, {
      authenticatedUserId: trustedOwnerUserId,
      trustedOwnerUserId,
      correlationId,
      priorStagesCompleted: true,
    });
    if (!authResult.ok) {
      await releaseAccountDeletionLock(service, lock.operationId, 'failed', 'auth_user_deletion');
      return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
    }

    await releaseAccountDeletionLock(service, lock.operationId, 'completed');
    return { ok: true, mutated: true };
  } catch {
    await releaseAccountDeletionLock(service, lock.operationId, 'failed', 'unexpected');
    return { ok: false, code: 'ACCOUNT_DELETION_FAILED', mutated: false };
  }
}

/** After T008 all mandatory capabilities are registered when env is configured. */
export const ACCOUNT_DELETION_DEFERRED_CAPABILITIES: AccountDeletionCapabilityId[] = [];
