import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import {
  clearAccountDeletionCapabilitiesForTests,
  evaluateAccountDeletionReadiness,
} from './delete-capabilities';

const stages: string[] = [];

vi.mock('./delete-lock', () => ({
  acquireAccountDeletionLock: async () => {
    stages.push('lock');
    return {
      ok: true,
      operationId: 'op-1',
      correlationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    };
  },
  releaseAccountDeletionLock: async () => {
    stages.push('release');
  },
  ACCOUNT_DELETION_LOCK_TTL_MS: 1,
}));

vi.mock('./delete-stripe', async () => {
  const actual = await vi.importActual<typeof import('./delete-stripe')>('./delete-stripe');
  return {
    ...actual,
    cancelTrustedAccountStripeSubscription: vi.fn(async () => {
      stages.push('stripe');
      return { ok: true, outcome: 'no_customer', canceledSubscriptionIds: [] };
    }),
  };
});

vi.mock('./delete-local-content', async () => {
  const actual = await vi.importActual<typeof import('./delete-local-content')>(
    './delete-local-content',
  );
  return {
    ...actual,
    assertPersonalTenantSoleMember: async () => ({ ok: true }),
    executeLocalAccountContentDeletion: async () => {
      stages.push('local');
      return {
        ok: true,
        deleted: {
          profileLinks: true,
          projects: 0,
          researchPapers: 0,
          savedConnections: true,
          collections: true,
        },
        cleanupJobId: null,
        objectCount: 0,
      };
    },
  };
});

vi.mock('./delete-analytics', async () => {
  const actual = await vi.importActual<typeof import('./delete-analytics')>('./delete-analytics');
  return {
    ...actual,
    anonymizeTrustedAccountAnalytics: async () => {
      stages.push('analytics');
      return {
        ok: true,
        deleted: { analyticsEvents: 0, publicProfileEvents: 0, projectViewEvents: 0 },
        anonymized: { viewerAnalyticsEvents: 0, moderationReports: 0 },
      };
    },
  };
});

vi.mock('./delete-audit', async () => {
  const actual = await vi.importActual<typeof import('./delete-audit')>('./delete-audit');
  return {
    ...actual,
    insertTrustedDeletionAudit: async () => {
      stages.push('audit');
      return { ok: true, inserted: true, auditId: 'audit-1' };
    },
  };
});

vi.mock('./delete-auth-user', async () => {
  const actual = await vi.importActual<typeof import('./delete-auth-user')>('./delete-auth-user');
  return {
    ...actual,
    deleteTrustedSupabaseAuthUser: async () => {
      stages.push('auth');
      return { ok: true, deleted: true, alreadyMissing: false };
    },
  };
});

import {
  ACCOUNT_DELETION_DEFERRED_CAPABILITIES,
  ACCOUNT_DELETION_INTENDED_ORDER,
  ensureAccountDeletionCapabilitiesRegistered,
  runAccountDeletionOrchestrator,
} from './delete-orchestrator';

const OWNER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROFILE_A = 'paaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT_A = 'taaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('WS10-T008 integrated orchestrator order', () => {
  beforeEach(() => {
    stages.length = 0;
    clearAccountDeletionCapabilitiesForTests();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.STRIPE_SECRET_KEY = 'sk_test_account_deletion_fixture';
    ensureAccountDeletionCapabilitiesRegistered();
  });

  it('has no deferred capabilities when env is configured', () => {
    expect(ACCOUNT_DELETION_DEFERRED_CAPABILITIES).toEqual([]);
    expect(evaluateAccountDeletionReadiness()).toEqual({ ready: true });
  });

  it('documents final runtime order with Auth last', () => {
    expect(ACCOUNT_DELETION_INTENDED_ORDER.at(-2)).toBe('delete_supabase_auth_user_last');
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('cancel_stripe_or_verify_no_subscription'),
    ).toBeLessThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('delete_approved_local_content'));
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('anonymize_or_delete_analytics'),
    ).toBeLessThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('insert_immutable_deletion_audit'));
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('insert_immutable_deletion_audit'),
    ).toBeLessThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('delete_supabase_auth_user_last'));
  });

  it('executes Stripe → local → analytics → audit → Auth in order', async () => {
    const supabase = {
      from: (table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: PROFILE_A, tenant_id: TENANT_A, owner_user_id: OWNER_A },
                  error: null,
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      },
    };

    const result = await runAccountDeletionOrchestrator({
      user: { id: OWNER_A } as User,
      supabase: supabase as never,
      createServiceClient: async () => ({}) as never,
      getStripeClient: () => ({}) as never,
    });

    expect(result).toEqual({ ok: true, mutated: true });
    expect(stages).toEqual(['lock', 'stripe', 'local', 'analytics', 'audit', 'auth', 'release']);
  });

  it('stops before Auth when Stripe cancellation fails', async () => {
    const { cancelTrustedAccountStripeSubscription } = await import('./delete-stripe');
    vi.mocked(cancelTrustedAccountStripeSubscription).mockImplementationOnce(async () => {
      stages.push('stripe');
      return { ok: false, reason: 'stripe_error' };
    });

    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { id: PROFILE_A, tenant_id: TENANT_A, owner_user_id: OWNER_A },
              error: null,
            }),
          }),
        }),
      }),
    };

    const result = await runAccountDeletionOrchestrator({
      user: { id: OWNER_A } as User,
      supabase: supabase as never,
      createServiceClient: async () => ({}) as never,
      getStripeClient: () => ({}) as never,
    });

    expect(result.ok).toBe(false);
    expect(stages).toContain('stripe');
    expect(stages).not.toContain('local');
    expect(stages).not.toContain('analytics');
    expect(stages).not.toContain('audit');
    expect(stages).not.toContain('auth');
  });
});
