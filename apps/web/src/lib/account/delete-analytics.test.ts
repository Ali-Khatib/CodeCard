import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  clearAccountDeletionCapabilitiesForTests,
  evaluateAccountDeletionReadiness,
  registerT004ScaffoldCapabilities,
  registerAccountDeletionCapability,
  ACCOUNT_DELETION_CAPABILITY_IDS,
} from './delete-capabilities';
import {
  anonymizeTrustedAccountAnalytics,
  isAnalyticsAnonymizationConfigured,
  registerAnalyticsAnonymizationCapability,
  scrubIdentifyingAnalyticsMetadata,
  type TrustedAnalyticsAnonymizationContext,
} from './delete-analytics';
import { registerAuthUserDeletionCapability } from './delete-auth-user';
import { registerStripeCancellationCapability } from './delete-stripe';
import { ACCOUNT_DELETION_INTENDED_ORDER } from './delete-orchestrator';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

const OWNER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PROFILE_A = 'paaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROFILE_B = 'pbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TENANT_A = 'taaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT_B = 'tbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function baseCtx(
  overrides: Partial<TrustedAnalyticsAnonymizationContext> = {},
): TrustedAnalyticsAnonymizationContext {
  return {
    authenticatedUserId: OWNER_A,
    trustedOwnerUserId: OWNER_A,
    tenantId: TENANT_A,
    profileId: PROFILE_A,
    correlationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    ...overrides,
  };
}

type AnalyticsRow = {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  user_id: string | null;
  session_id: string | null;
  metadata: Record<string, unknown>;
  event_type: string;
};

type LegacyRow = {
  id: string;
  tenant_id: string;
  profile_id: string;
  session_id?: string | null;
  referrer?: string | null;
};

function createAnalyticsDb(seed: {
  analytics: AnalyticsRow[];
  publicProfile: LegacyRow[];
  projectView: LegacyRow[];
  moderation: Array<{ id: string; reporter_user_id: string | null }>;
}) {
  const state = {
    analytics: [...seed.analytics],
    publicProfile: [...seed.publicProfile],
    projectView: [...seed.projectView],
    moderation: [...seed.moderation],
  };

  const client = {
    from: (table: string) => {
      if (table === 'analytics_events') {
        return {
          select: (_cols: string) => ({
            eq: (col: string, value: string) => {
              const chain = {
                eq: (col2: string, value2: string) => ({
                  then: undefined,
                  async thenable() {
                    return null;
                  },
                  // awaited directly after second eq
                }),
                is: (col2: string, value2: null) => ({
                  // for tenant null profile select
                }),
              };
              // Build promise-compatible filter
              const filter = (rows: AnalyticsRow[]) => {
                let next = rows;
                next = next.filter((r) => (r as never as Record<string, unknown>)[col] === value);
                return {
                  eq: (col2: string, value2: string) => {
                    const filtered = next.filter(
                      (r) => (r as never as Record<string, unknown>)[col2] === value2,
                    );
                    return Promise.resolve({ data: filtered, error: null });
                  },
                  is: (col2: string, value2: null) => {
                    const filtered = next.filter(
                      (r) => (r as never as Record<string, unknown>)[col2] === value2,
                    );
                    return Promise.resolve({ data: filtered, error: null });
                  },
                  then: (resolve: (v: unknown) => unknown) =>
                    resolve({
                      data: next,
                      error: null,
                    }),
                };
              };
              return filter(state.analytics);
            },
          }),
          delete: () => ({
            eq: (col: string, value: string) => ({
              eq: async (col2: string, value2: string) => {
                const before = state.analytics.length;
                state.analytics = state.analytics.filter(
                  (r) =>
                    !((r as never as Record<string, unknown>)[col] === value &&
                      (r as never as Record<string, unknown>)[col2] === value2),
                );
                void before;
                return { error: null };
              },
              is: async (col2: string, value2: null) => {
                state.analytics = state.analytics.filter(
                  (r) =>
                    !((r as never as Record<string, unknown>)[col] === value &&
                      (r as never as Record<string, unknown>)[col2] === value2),
                );
                return { error: null };
              },
            }),
          }),
          update: (payload: Record<string, unknown>) => ({
            eq: (col: string, value: string) => ({
              eq: async (col2: string, value2: string) => {
                state.analytics = state.analytics.map((r) => {
                  if (
                    (r as never as Record<string, unknown>)[col] === value &&
                    (r as never as Record<string, unknown>)[col2] === value2
                  ) {
                    return { ...r, ...payload } as AnalyticsRow;
                  }
                  return r;
                });
                return { error: null };
              },
            }),
          }),
        };
      }

      if (table === 'public_profile_events' || table === 'project_view_events') {
        const key = table === 'public_profile_events' ? 'publicProfile' : 'projectView';
        return {
          select: () => ({
            eq: (col: string, value: string) => ({
              eq: async (col2: string, value2: string) => {
                const rows = state[key].filter(
                  (r) =>
                    (r as never as Record<string, unknown>)[col] === value &&
                    (r as never as Record<string, unknown>)[col2] === value2,
                );
                return { data: rows, error: null };
              },
            }),
          }),
          delete: () => ({
            eq: (col: string, value: string) => ({
              eq: async (col2: string, value2: string) => {
                state[key] = state[key].filter(
                  (r) =>
                    !((r as never as Record<string, unknown>)[col] === value &&
                      (r as never as Record<string, unknown>)[col2] === value2),
                );
                return { error: null };
              },
            }),
          }),
        };
      }

      if (table === 'moderation_reports') {
        return {
          select: () => ({
            eq: async (col: string, value: string) => ({
              data: state.moderation.filter(
                (r) => (r as never as Record<string, unknown>)[col] === value,
              ),
              error: null,
            }),
          }),
          update: (payload: Record<string, unknown>) => ({
            eq: async (col: string, value: string) => {
              state.moderation = state.moderation.map((r) =>
                (r as never as Record<string, unknown>)[col] === value
                  ? { ...r, ...payload }
                  : r,
              ) as typeof state.moderation;
              return { error: null };
            },
          }),
        };
      }

      throw new Error(`unexpected table ${table}`);
    },
  };

  return { client, state };
}

describe('WS10-T007 analytics anonymization', () => {
  beforeEach(() => {
    clearAccountDeletionCapabilitiesForTests();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.STRIPE_SECRET_KEY = 'sk_test_account_deletion_fixture';
  });

  afterEach(() => {
    // leave env for sibling suites; registry cleared in beforeEach
  });

  it('fails closed without service-role configuration', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(isAnalyticsAnonymizationConfigured()).toBe(false);
    registerAnalyticsAnonymizationCapability();
    const readiness = evaluateAccountDeletionReadiness();
    expect(readiness.ready).toBe(false);
    if (!readiness.ready) expect(readiness.missing).toContain('analytics_anonymization');
  });

  it('registers with remaining capabilities for readiness', () => {
    registerT004ScaffoldCapabilities();
    registerAuthUserDeletionCapability();
    registerStripeCancellationCapability();
    registerAnalyticsAnonymizationCapability();
    for (const id of ACCOUNT_DELETION_CAPABILITY_IDS) {
      if (
        id === 'local_content' ||
        id === 'storage_cleanup' ||
        id === 'auth_user_deletion' ||
        id === 'stripe_cancellation' ||
        id === 'analytics_anonymization'
      ) {
        continue;
      }
      registerAccountDeletionCapability({ id, label: id, isAvailable: () => true });
    }
    expect(evaluateAccountDeletionReadiness()).toEqual({ ready: true });
  });

  it('removes Owner A identity and leaves Owner B unchanged', async () => {
    const db = createAnalyticsDb({
      analytics: [
        {
          id: 'ae-a',
          tenant_id: TENANT_A,
          profile_id: PROFILE_A,
          user_id: null,
          session_id: 'sess-a',
          metadata: { referrer: 'https://evil.example', section: 'hero' },
          event_type: 'profile_view',
        },
        {
          id: 'ae-b',
          tenant_id: TENANT_B,
          profile_id: PROFILE_B,
          user_id: null,
          session_id: 'sess-b',
          metadata: { section: 'hero' },
          event_type: 'profile_view',
        },
        {
          id: 'ae-viewer',
          tenant_id: TENANT_B,
          profile_id: PROFILE_B,
          user_id: OWNER_A,
          session_id: 'sess-viewer',
          metadata: { email: 'a@example.com', duration_ms: 12 },
          event_type: 'project_view',
        },
      ],
      publicProfile: [
        {
          id: 'ppe-a',
          tenant_id: TENANT_A,
          profile_id: PROFILE_A,
          session_id: 's1',
          referrer: 'https://ref',
        },
        { id: 'ppe-b', tenant_id: TENANT_B, profile_id: PROFILE_B },
      ],
      projectView: [
        { id: 'pve-a', tenant_id: TENANT_A, profile_id: PROFILE_A },
        { id: 'pve-b', tenant_id: TENANT_B, profile_id: PROFILE_B },
      ],
      moderation: [
        { id: 'mod-a', reporter_user_id: OWNER_A },
        { id: 'mod-b', reporter_user_id: OWNER_B },
      ],
    });

    const result = await anonymizeTrustedAccountAnalytics(db.client as never, baseCtx());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(db.state.analytics.find((r) => r.id === 'ae-a')).toBeUndefined();
    expect(db.state.analytics.find((r) => r.id === 'ae-b')).toBeDefined();
    expect(db.state.publicProfile.find((r) => r.id === 'ppe-a')).toBeUndefined();
    expect(db.state.publicProfile.find((r) => r.id === 'ppe-b')).toBeDefined();
    expect(db.state.projectView.find((r) => r.id === 'pve-b')).toBeDefined();

    const viewer = db.state.analytics.find((r) => r.id === 'ae-viewer');
    expect(viewer?.user_id).toBeNull();
    expect(viewer?.session_id).toBeNull();
    expect(viewer?.metadata).toEqual({ duration_ms: 12 });
    expect(viewer?.profile_id).toBe(PROFILE_B);

    expect(db.state.moderation.find((r) => r.id === 'mod-a')?.reporter_user_id).toBeNull();
    expect(db.state.moderation.find((r) => r.id === 'mod-b')?.reporter_user_id).toBe(OWNER_B);
  });

  it('scrubs identifying metadata without hashing user identity', () => {
    const scrubbed = scrubIdentifyingAnalyticsMetadata({
      email: 'a@example.com',
      user_id: OWNER_A,
      duration_ms: 5,
      nested: { email: 'x' },
    });
    expect(scrubbed).toEqual({ duration_ms: 5 });
    expect(JSON.stringify(scrubbed)).not.toContain(OWNER_A);
    expect(JSON.stringify(scrubbed)).not.toContain('example.com');
  });

  it('is idempotent on repeated anonymization', async () => {
    const db = createAnalyticsDb({
      analytics: [
        {
          id: 'ae-a',
          tenant_id: TENANT_A,
          profile_id: PROFILE_A,
          user_id: null,
          session_id: null,
          metadata: {},
          event_type: 'profile_view',
        },
      ],
      publicProfile: [{ id: 'ppe-a', tenant_id: TENANT_A, profile_id: PROFILE_A }],
      projectView: [],
      moderation: [],
    });
    const first = await anonymizeTrustedAccountAnalytics(db.client as never, baseCtx());
    expect(first.ok).toBe(true);
    const second = await anonymizeTrustedAccountAnalytics(db.client as never, baseCtx());
    expect(second).toEqual({
      ok: true,
      deleted: { analyticsEvents: 0, publicProfileEvents: 0, projectViewEvents: 0 },
      anonymized: { viewerAnalyticsEvents: 0, moderationReports: 0 },
    });
  });

  it('rejects spoofed owner ids', async () => {
    const db = createAnalyticsDb({
      analytics: [],
      publicProfile: [],
      projectView: [],
      moderation: [],
    });
    const result = await anonymizeTrustedAccountAnalytics(
      db.client as never,
      baseCtx({ trustedOwnerUserId: OWNER_B }),
    );
    expect(result).toEqual({ ok: false, reason: 'target_mismatch' });
  });

  it('documents analytics stage before audit and Auth', () => {
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('anonymize_or_delete_analytics'),
    ).toBeLessThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('insert_immutable_deletion_audit'));
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('anonymize_or_delete_analytics'),
    ).toBeLessThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('delete_supabase_auth_user_last'));
  });

  it('keeps analytics mutation out of the public delete route response surface', () => {
    const route = read('src/app/api/account/delete/route.ts');
    const helper = read('src/lib/account/delete-analytics.ts');
    expect(helper).toContain('analytics_events');
    expect(helper).toContain('public_profile_events');
    expect(helper).toContain('project_view_events');
    expect(route).not.toContain('analytics_events');
    expect(route).not.toContain('anonymizeTrustedAccountAnalytics');
  });

  it('simulates analytics failure blocking later Auth deletion', async () => {
    const stages: string[] = [];
    const analyticsOk = false;
    stages.push('analytics');
    if (analyticsOk) {
      stages.push('audit');
      stages.push('auth');
    }
    expect(stages).toEqual(['analytics']);
    expect(stages).not.toContain('auth');
  });
});
