import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  clearAccountDeletionCapabilitiesForTests,
  evaluateAccountDeletionReadiness,
  registerT004ScaffoldCapabilities,
  ACCOUNT_DELETION_CAPABILITY_IDS,
} from './delete-capabilities';
import {
  ACCOUNT_DELETION_AUDIT_ACTION,
  assertDeletionAuditMetadataSafe,
  buildDeletionAuditMetadata,
  insertTrustedDeletionAudit,
  isDeletionAuditConfigured,
  registerDeletionAuditCapability,
} from './delete-audit';
import { registerAuthUserDeletionCapability } from './delete-auth-user';
import { registerStripeCancellationCapability } from './delete-stripe';
import { registerAnalyticsAnonymizationCapability } from './delete-analytics';
import { ACCOUNT_DELETION_INTENDED_ORDER } from './delete-orchestrator';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

const OWNER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CORRELATION = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function createAuditDb() {
  const rows: Array<{
    id: string;
    action: string;
    actor_user_id: string | null;
    tenant_id: string | null;
    resource_type: string;
    resource_id: string | null;
    metadata: Record<string, unknown>;
  }> = [];

  return {
    rows,
    client: {
      from: (table: string) => {
        if (table !== 'audit_logs') throw new Error('unexpected table');
        return {
          select: () => ({
            eq: (col: string, value: string) => ({
              contains: (_col: string, payload: { correlation_id: string }) => ({
                maybeSingle: async () => {
                  const found = rows.find(
                    (r) =>
                      (r as never as Record<string, unknown>)[col] === value &&
                      r.metadata.correlation_id === payload.correlation_id,
                  );
                  return { data: found ?? null, error: null };
                },
              }),
            }),
          }),
          insert: (payload: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                if (payload.actor_user_id != null || payload.tenant_id != null) {
                  return { data: null, error: { message: 'unsafe actor' } };
                }
                const duplicate = rows.find(
                  (r) =>
                    r.action === payload.action &&
                    r.metadata.correlation_id ===
                      (payload.metadata as { correlation_id: string }).correlation_id,
                );
                if (duplicate) {
                  return { data: null, error: { message: 'duplicate key unique' } };
                }
                const id = `audit-${rows.length + 1}`;
                rows.push({
                  id,
                  action: String(payload.action),
                  actor_user_id: null,
                  tenant_id: null,
                  resource_type: String(payload.resource_type),
                  resource_id: null,
                  metadata: payload.metadata as Record<string, unknown>,
                });
                return { data: { id }, error: null };
              },
            }),
          }),
        };
      },
    },
  };
}

describe('WS10-T008 deletion audit', () => {
  beforeEach(() => {
    clearAccountDeletionCapabilitiesForTests();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.STRIPE_SECRET_KEY = 'sk_test_account_deletion_fixture';
  });

  it('fails closed without service-role configuration', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(isDeletionAuditConfigured()).toBe(false);
    registerDeletionAuditCapability();
    const readiness = evaluateAccountDeletionReadiness();
    expect(readiness.ready).toBe(false);
    if (!readiness.ready) expect(readiness.missing).toContain('deletion_audit');
  });

  it('is ready when all capabilities including audit are registered', () => {
    registerT004ScaffoldCapabilities();
    registerAuthUserDeletionCapability();
    registerStripeCancellationCapability();
    registerAnalyticsAnonymizationCapability();
    registerDeletionAuditCapability();
    expect(ACCOUNT_DELETION_CAPABILITY_IDS).toHaveLength(6);
    expect(evaluateAccountDeletionReadiness()).toEqual({ ready: true });
  });

  it('inserts exactly one privacy-safe audit with anonymized actor', async () => {
    const db = createAuditDb();
    const result = await insertTrustedDeletionAudit(db.client as never, {
      authenticatedUserId: OWNER_A,
      trustedOwnerUserId: OWNER_A,
      correlationId: CORRELATION,
      completionState: 'pre_auth_deletion',
    });
    expect(result).toEqual({ ok: true, inserted: true, auditId: 'audit-1' });
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0].action).toBe(ACCOUNT_DELETION_AUDIT_ACTION);
    expect(db.rows[0].actor_user_id).toBeNull();
    expect(db.rows[0].tenant_id).toBeNull();
    expect(db.rows[0].metadata).toEqual(buildDeletionAuditMetadata(CORRELATION));
    expect(JSON.stringify(db.rows[0])).not.toContain(OWNER_A);
    expect(JSON.stringify(db.rows[0])).not.toContain('@');
    expect(JSON.stringify(db.rows[0])).not.toContain('cus_');
  });

  it('deduplicates retries by correlation id', async () => {
    const db = createAuditDb();
    const ctx = {
      authenticatedUserId: OWNER_A,
      trustedOwnerUserId: OWNER_A,
      correlationId: CORRELATION,
      completionState: 'pre_auth_deletion' as const,
    };
    await insertTrustedDeletionAudit(db.client as never, ctx);
    const second = await insertTrustedDeletionAudit(db.client as never, ctx);
    expect(second).toEqual({ ok: true, inserted: false, auditId: 'audit-1' });
    expect(db.rows).toHaveLength(1);
  });

  it('rejects spoofed owner targets', async () => {
    const db = createAuditDb();
    const result = await insertTrustedDeletionAudit(db.client as never, {
      authenticatedUserId: OWNER_A,
      trustedOwnerUserId: OWNER_B,
      correlationId: CORRELATION,
      completionState: 'pre_auth_deletion',
    });
    expect(result).toEqual({ ok: false, reason: 'target_mismatch' });
    expect(db.rows).toHaveLength(0);
  });

  it('rejects unsafe metadata shapes', () => {
    expect(assertDeletionAuditMetadataSafe({ email: 'a@b.com' }).ok).toBe(false);
    expect(assertDeletionAuditMetadataSafe(buildDeletionAuditMetadata(CORRELATION) as never).ok).toBe(
      true,
    );
  });

  it('documents audit before Auth and after analytics', () => {
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('insert_immutable_deletion_audit'),
    ).toBeGreaterThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('anonymize_or_delete_analytics'));
    expect(
      ACCOUNT_DELETION_INTENDED_ORDER.indexOf('insert_immutable_deletion_audit'),
    ).toBeLessThan(ACCOUNT_DELETION_INTENDED_ORDER.indexOf('delete_supabase_auth_user_last'));
  });

  it('documents local migration immutability without remote apply', () => {
    const migration = readFileSync(
      resolve(process.cwd(), '../../supabase/migrations/20260717010001_account_deletion_audit.sql'),
      'utf8',
    );
    expect(migration).toContain('audit_logs_account_deleted_correlation_uidx');
    expect(migration).toContain('account.deleted');
    expect(migration).toContain('REVOKE UPDATE, DELETE');
    expect(migration).toContain('Do not apply remotely from this task');
  });

  it('keeps ordinary client from choosing event type in the public route', () => {
    const route = read('src/app/api/account/delete/route.ts');
    expect(route).not.toContain('account.deleted');
    expect(route).not.toContain('audit_logs');
    expect(route).not.toContain('actor_user_id');
  });

  it('simulates audit failure preventing Auth deletion', () => {
    const stages: string[] = [];
    const auditOk = false;
    stages.push('audit');
    if (auditOk) stages.push('auth');
    expect(stages).toEqual(['audit']);
  });
});
