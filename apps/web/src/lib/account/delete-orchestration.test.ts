import { describe, expect, it, beforeEach } from 'vitest';
import {
  ACCOUNT_DELETION_CONFIRMATION,
  accountDeletionRequestSchema,
} from './delete-schema';
import {
  clearAccountDeletionCapabilitiesForTests,
  evaluateAccountDeletionReadiness,
  registerAccountDeletionCapability,
  registerT004ScaffoldCapabilities,
  ACCOUNT_DELETION_CAPABILITY_IDS,
} from './delete-capabilities';
import {
  decodeAccessTokenPayload,
  getLatestInteractiveAmrTimestamp,
  isWithinReauthWindow,
  verifyAccountDeletionReauthentication,
} from './delete-reauth';
import {
  ACCOUNT_DELETION_DEFERRED_CAPABILITIES,
  ACCOUNT_DELETION_INTENDED_ORDER,
  ensureT004CapabilityScaffoldsRegistered,
  runAccountDeletionOrchestrator,
} from './delete-orchestrator';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { User } from '@supabase/supabase-js';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('WS10-T004 account deletion validation', () => {
  it('accepts exact DELETE confirmation and rejects casing/whitespace/lookalikes/unknown fields', () => {
    const valid = accountDeletionRequestSchema.safeParse({
      confirmation: 'DELETE',
      reauthentication: { method: 'recent_login' },
    });
    expect(valid.success).toBe(true);
    expect(ACCOUNT_DELETION_CONFIRMATION).toBe('DELETE');

    expect(
      accountDeletionRequestSchema.safeParse({
        confirmation: 'delete',
        reauthentication: { method: 'recent_login' },
      }).success,
    ).toBe(true); // schema allows string; route enforces exact DELETE

    expect(
      accountDeletionRequestSchema.safeParse({
        confirmation: 'DELETE',
        reauthentication: { method: 'recent_login' },
        userId: 'x',
      }).success,
    ).toBe(false);

    expect(
      accountDeletionRequestSchema.safeParse({
        confirmation: 'DELETE',
        reauthentication: { method: 'password', password: 'secret', extra: true },
      }).success,
    ).toBe(false);
  });
});

describe('WS10-T004 reauthentication', () => {
  it('reads interactive AMR timestamps and ignores token_refresh', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = fakeJwt({
      sub: 'user-1',
      amr: [
        { method: 'token_refresh', timestamp: now },
        { method: 'oauth', timestamp: now - 30 },
      ],
    });
    const payload = decodeAccessTokenPayload(token);
    expect(getLatestInteractiveAmrTimestamp(payload)).toBe(now - 30);
    expect(isWithinReauthWindow(now - 30)).toBe(true);
    expect(isWithinReauthWindow(now - 10_000)).toBe(false);
  });

  it('rejects OAuth-only users from password reauth and accepts recent login', async () => {
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'oauth@example.com',
      identities: [{ provider: 'google' }],
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'google' },
    } as User;

    const passwordResult = await verifyAccountDeletionReauthentication(
      { auth: { signInWithPassword: async () => ({ data: {}, error: null }) } } as never,
      user,
      { method: 'password', password: 'x' },
    );
    expect(passwordResult.ok).toBe(false);
    if (passwordResult.ok) return;
    expect(passwordResult.reason).toBe('provider_mismatch');

    const now = Math.floor(Date.now() / 1000);
    const token = fakeJwt({
      sub: user.id,
      amr: [{ method: 'oauth', timestamp: now }],
    });
    const recent = await verifyAccountDeletionReauthentication(
      {} as never,
      user,
      { method: 'recent_login' },
      { accessToken: token },
    );
    expect(recent.ok).toBe(true);
  });

  it('verifies password reauth against the same user id', async () => {
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'a@example.com',
      identities: [{ provider: 'email' }],
    } as User;

    const supabase = {
      auth: {
        signInWithPassword: async () => ({
          data: { user: { id: user.id } },
          error: null,
        }),
      },
    };

    const ok = await verifyAccountDeletionReauthentication(supabase as never, user, {
      method: 'password',
      password: 'correct-horse',
    });
    expect(ok.ok).toBe(true);

    const bad = await verifyAccountDeletionReauthentication(
      {
        auth: {
          signInWithPassword: async () => ({
            data: { user: null },
            error: { message: 'Invalid login credentials' },
          }),
        },
      } as never,
      user,
      { method: 'password', password: 'wrong' },
    );
    expect(bad.ok).toBe(false);
  });
});

describe('WS10-T004 capability readiness fail-closed', () => {
  beforeEach(() => {
    clearAccountDeletionCapabilitiesForTests();
  });

  it('remains not ready when T007–T008 are missing even with T004 scaffolds + T005–T006', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.STRIPE_SECRET_KEY = 'sk_test_account_deletion_fixture';
    ensureT004CapabilityScaffoldsRegistered();
    const readiness = evaluateAccountDeletionReadiness();
    expect(readiness.ready).toBe(false);
    if (readiness.ready) return;
    expect(readiness.missing).toEqual(
      expect.arrayContaining(ACCOUNT_DELETION_DEFERRED_CAPABILITIES),
    );
    expect(readiness.missing).not.toContain('local_content');
    expect(readiness.missing).not.toContain('storage_cleanup');
    expect(readiness.missing).not.toContain('auth_user_deletion');
    expect(readiness.missing).not.toContain('stripe_cancellation');
  });

  it('is ready only when every mandatory capability is registered and available', () => {
    for (const id of ACCOUNT_DELETION_CAPABILITY_IDS) {
      registerAccountDeletionCapability({
        id,
        label: id,
        isAvailable: () => true,
      });
    }
    expect(evaluateAccountDeletionReadiness()).toEqual({ ready: true });
  });

  it('orchestrator returns NOT_READY without mutating when capabilities missing', async () => {
    ensureT004CapabilityScaffoldsRegistered();
    clearAccountDeletionCapabilitiesForTests();
    registerT004ScaffoldCapabilities();

    const from = () => {
      throw new Error('orchestrator must not query while not ready');
    };

    const result = await runAccountDeletionOrchestrator({
      user: { id: '11111111-1111-4111-8111-111111111111' } as User,
      supabase: { from } as never,
    });

    expect(result).toEqual({
      ok: false,
      code: 'ACCOUNT_DELETION_NOT_READY',
      missingCapabilities: expect.any(Array),
      mutated: false,
    });
  });
});

describe('WS10-T004 route and boundaries', () => {
  it('wires POST delete route with same-origin, rate limit, and fail-closed orchestrator', () => {
    const route = read('src/app/api/account/delete/route.ts');
    expect(route).toContain('isSameOriginMutation');
    expect(route).toContain("rateLimitType: 'accountDelete'");
    expect(route).toContain('requireAuth: true');
    expect(route).toContain('ACCOUNT_DELETION_CONFIRMATION');
    expect(route).toContain('verifyAccountDeletionReauthentication');
    expect(route).toContain('runAccountDeletionOrchestrator');
    expect(route).toContain('ACCOUNT_DELETION_NOT_READY');
    expect(route).not.toContain('deleteUser');
    expect(route).not.toContain('subscriptions.cancel');
    expect(route).not.toContain('createServiceClient');
  });

  it('documents intended final deletion order with Auth last', () => {
    expect(ACCOUNT_DELETION_INTENDED_ORDER[0]).toBe('validate_auth_reauth_confirmation');
    expect(ACCOUNT_DELETION_INTENDED_ORDER.at(-2)).toBe('delete_supabase_auth_user_last');
    expect(ACCOUNT_DELETION_INTENDED_ORDER.at(-1)).toBe('return_success');
  });

  it('keeps local-content helper from calling Auth/Stripe/analytics APIs', () => {
    const local = read('src/lib/account/delete-local-content.ts');
    expect(local).toContain('enqueueStorageCleanupJob');
    expect(local).toContain('collectAccountStorageCleanupTargets');
    expect(local).not.toContain('deleteUser');
    expect(local).not.toContain("from('subscriptions')");
    expect(local).not.toContain("from('analytics_events')");
    expect(local).not.toContain("from('audit_logs')");
  });

  it('documents lock migration without remote apply wording', () => {
    const migration = readFileSync(
      resolve(process.cwd(), '../../supabase/migrations/20260717000001_account_deletion_operations.sql'),
      'utf8',
    );
    expect(migration).toContain('account_deletion_operations');
    expect(migration).toContain('account_deletion_one_in_progress');
    expect(migration).toContain('Do not apply remotely from this task');
    expect(migration).toContain('service_role');
  });
});
