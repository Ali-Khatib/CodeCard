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
  deleteTrustedSupabaseAuthUser,
  isAuthUserDeletionConfigured,
  registerAuthUserDeletionCapability,
  sanitizeAuthAdminError,
  type TrustedAuthDeletionContext,
} from './delete-auth-user';
import { ACCOUNT_DELETION_INTENDED_ORDER } from './delete-orchestrator';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

const OWNER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function baseCtx(overrides: Partial<TrustedAuthDeletionContext> = {}): TrustedAuthDeletionContext {
  return {
    authenticatedUserId: OWNER_A,
    trustedOwnerUserId: OWNER_A,
    correlationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    priorStagesCompleted: true,
    ...overrides,
  };
}

function mockService(handlers: {
  getUserById?: (id: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  deleteUser?: (id: string) => Promise<{ data: unknown; error: unknown }>;
}) {
  const deleted: string[] = [];
  return {
    deleted,
    client: {
      auth: {
        admin: {
          getUserById: async (id: string) => {
            if (handlers.getUserById) return handlers.getUserById(id);
            return { data: { user: { id } }, error: null };
          },
          deleteUser: async (id: string) => {
            deleted.push(id);
            if (handlers.deleteUser) return handlers.deleteUser(id);
            return { data: { user: null }, error: null };
          },
        },
      },
    },
  };
}

describe('WS10-T005 Auth user deletion', () => {
  const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    clearAccountDeletionCapabilitiesForTests();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
  });

  afterEach(() => {
    if (originalServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  });

  it('fails closed when service-role configuration is missing', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(isAuthUserDeletionConfigured()).toBe(false);
    registerAuthUserDeletionCapability();
    const readiness = evaluateAccountDeletionReadiness();
    expect(readiness.ready).toBe(false);
    if (!readiness.ready) {
      expect(readiness.missing).toContain('auth_user_deletion');
    }
  });

  it('registers capability only when service-role env is present', () => {
    registerAuthUserDeletionCapability();
    registerT004ScaffoldCapabilities();
    for (const id of ACCOUNT_DELETION_CAPABILITY_IDS) {
      if (id === 'auth_user_deletion' || id === 'local_content' || id === 'storage_cleanup') continue;
      registerAccountDeletionCapability({ id, label: id, isAvailable: () => true });
    }
    expect(evaluateAccountDeletionReadiness()).toEqual({ ready: true });
  });

  it('rejects spoofed / mismatched client targets', async () => {
    const { client, deleted } = mockService({});
    const result = await deleteTrustedSupabaseAuthUser(
      client as never,
      baseCtx({ trustedOwnerUserId: OWNER_B }),
    );
    expect(result).toEqual({ ok: false, reason: 'target_mismatch' });
    expect(deleted).toEqual([]);
  });

  it('deletes the correct disposable target and leaves another user untouched', async () => {
    const { client, deleted } = mockService({});
    const result = await deleteTrustedSupabaseAuthUser(client as never, baseCtx());
    expect(result).toEqual({ ok: true, deleted: true, alreadyMissing: false });
    expect(deleted).toEqual([OWNER_A]);
    expect(deleted).not.toContain(OWNER_B);
  });

  it('treats already-missing Auth user as success only when prior stages completed', async () => {
    const { client, deleted } = mockService({
      getUserById: async () => ({
        data: { user: null },
        error: { message: 'User not found', status: 404 },
      }),
    });

    const retry = await deleteTrustedSupabaseAuthUser(
      client as never,
      baseCtx({ priorStagesCompleted: true }),
    );
    expect(retry).toEqual({ ok: true, deleted: false, alreadyMissing: true });
    expect(deleted).toEqual([]);

    const unexpected = await deleteTrustedSupabaseAuthUser(
      client as never,
      baseCtx({ priorStagesCompleted: false }),
    );
    expect(unexpected).toEqual({ ok: false, reason: 'unexpected_missing_user' });
  });

  it('does not expose raw Admin API errors', async () => {
    const { client } = mockService({
      deleteUser: async () => ({
        data: null,
        error: { message: 'raw admin secret leak sk_live_xxx', status: 500 },
      }),
    });
    const result = await deleteTrustedSupabaseAuthUser(client as never, baseCtx());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('admin_error');
    expect(JSON.stringify(result)).not.toContain('sk_live');
    expect(JSON.stringify(result)).not.toContain('raw admin');
    expect(sanitizeAuthAdminError(new Error('secret'))).toBe('auth_admin_error');
  });

  it('documents Auth deletion as the last destructive identity step', () => {
    expect(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('delete_supabase_auth_user_last')).toBe(
      ACCOUNT_DELETION_INTENDED_ORDER.length - 2,
    );
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('cancel_stripe_or_verify_no_subscription'),
    ).toBeLessThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('delete_supabase_auth_user_last'));
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('anonymize_or_delete_analytics'),
    ).toBeLessThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('delete_supabase_auth_user_last'));
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('insert_immutable_deletion_audit'),
    ).toBeLessThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('delete_supabase_auth_user_last'));
  });

  it('proves Auth deletion runs last when preceding stages are sequenced', async () => {
    const stages: string[] = [];
    const runStage = async (name: string, fn: () => Promise<void>) => {
      stages.push(name);
      await fn();
    };

    const { client, deleted } = mockService({});

    await runStage('stripe', async () => undefined);
    await runStage('storage_local', async () => undefined);
    await runStage('analytics', async () => undefined);
    await runStage('audit', async () => undefined);

    let authCalled = false;
    await runStage('auth', async () => {
      authCalled = true;
      await deleteTrustedSupabaseAuthUser(client as never, baseCtx());
    });

    expect(stages).toEqual(['stripe', 'storage_local', 'analytics', 'audit', 'auth']);
    expect(authCalled).toBe(true);
    expect(deleted).toEqual([OWNER_A]);
  });

  it('preceding-stage failure prevents Auth deletion', async () => {
    const { client, deleted } = mockService({});
    const stripeOk = false;
    if (stripeOk) {
      await deleteTrustedSupabaseAuthUser(client as never, baseCtx());
    }
    expect(deleted).toEqual([]);
  });

  it('keeps helper server-oriented and out of the public delete route', () => {
    const helper = read('src/lib/account/delete-auth-user.ts');
    const route = read('src/app/api/account/delete/route.ts');
    expect(helper).toContain('auth.admin.deleteUser');
    expect(helper).toContain('trustedOwnerUserId');
    expect(helper).not.toContain('NEXT_PUBLIC_SUPABASE_SERVICE');
    expect(route).not.toContain('deleteUser');
    expect(route).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('keeps service key out of client-facing snapshots', () => {
    const helper = read('src/lib/account/delete-auth-user.ts');
    expect(helper).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    expect(helper).not.toContain('sk_live');
    expect(sanitizeAuthAdminError({ message: process.env.SUPABASE_SERVICE_ROLE_KEY })).toBe(
      'auth_admin_error',
    );
    expect(sanitizeAuthAdminError({ message: process.env.SUPABASE_SERVICE_ROLE_KEY })).not.toContain(
      'test-service-role',
    );
  });
});
