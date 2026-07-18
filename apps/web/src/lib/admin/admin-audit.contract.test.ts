import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repo = resolve(__dirname, '../../../../..');
const migration = readFileSync(
  resolve(repo, 'supabase/migrations/20260718014945_ws13_t008_admin_audit.sql'),
  'utf8',
);
const writer = readFileSync(
  resolve(repo, 'apps/web/src/lib/admin/admin-audit.ts'),
  'utf8',
);
const reportRoute = readFileSync(
  resolve(repo, 'apps/web/src/app/api/admin/reports/[id]/route.ts'),
  'utf8',
);
const authorization = readFileSync(
  resolve(repo, 'apps/web/src/lib/security/admin-api-authorization.ts'),
  'utf8',
);

describe('WS13-T008 immutable administrative auditing contracts', () => {
  it('provides one allowlisted canonical database and server writer', () => {
    expect(migration).toContain('FUNCTION public.insert_admin_audit_event');
    expect(writer).toContain("import 'server-only'");
    expect(writer).toContain("service.rpc('insert_admin_audit_event'");
    expect(writer).toContain('ADMIN_AUDIT_ACTIONS');
    expect(writer).not.toMatch(/request\.json|NextResponse|export async function (?:POST|PATCH)/);
  });

  it('enforces audit immutability for ordinary and privileged product roles', () => {
    expect(migration).toContain('BEFORE UPDATE OR DELETE ON public.audit_logs');
    expect(migration).toContain("RAISE EXCEPTION 'audit_logs_are_immutable'");
    expect(migration).toContain(
      'REVOKE INSERT, UPDATE, DELETE ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated',
    );
    expect(migration).toContain(
      'REVOKE UPDATE, DELETE ON TABLE public.audit_logs FROM service_role',
    );
    expect(migration).not.toMatch(
      /GRANT (?:ALL|UPDATE|DELETE)[^;]*ON TABLE public\.audit_logs TO (?:anon|authenticated|service_role)/,
    );
  });

  it('bounds metadata and rejects sensitive bodies and secrets', () => {
    expect(migration).toContain('octet_length(p_metadata::text) > 4096');
    expect(writer).toContain('ADMIN_AUDIT_METADATA_MAX_BYTES = 4096');
    for (const key of ['token', 'cookie', 'authorization', 'note', 'report', 'reason']) {
      expect(migration).toContain(`'${key}'`);
      expect(writer).toContain(`'${key}'`);
    }
  });

  it('uses stable action names and action/resource pairing', () => {
    for (const action of [
      'moderation_report.resolved',
      'moderation_report.dismissed',
      'content.hidden',
      'user.suspended',
      'moderation_note.updated',
    ]) {
      expect(migration).toContain(`'${action}'`);
      expect(writer).toContain(`'${action}'`);
    }
  });

  it('retrofits T004 atomically through the canonical writer', () => {
    const replacement = migration.slice(
      migration.indexOf('CREATE OR REPLACE FUNCTION public.admin_transition_moderation_report'),
    );
    expect(replacement).toContain('FOR UPDATE');
    expect(replacement).toContain('UPDATE public.moderation_reports');
    expect(replacement).toContain('public.insert_admin_audit_event(');
    expect(replacement).not.toContain('INSERT INTO public.audit_logs');
    expect(replacement).toContain("format('moderation-report:%s:%s'");
    expect(replacement).toContain("THEN 'idempotent'");
  });

  it('keeps admin identity server-derived through the canonical resolver', () => {
    expect(reportRoute).toContain('await requireGlobalAdminApiAccess()');
    expect(reportRoute).toContain('actorUserId: authorization.userId');
    expect(authorization).toContain('resolveGlobalAdminAuthorization');
    expect(authorization).not.toMatch(/user_metadata|tenant_role|request.*role/i);
  });

  it('exposes the database writer only to service_role', () => {
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.insert_admin_audit_event',
    );
    expect(migration).toContain('FROM PUBLIC, anon, authenticated');
    expect(migration).toContain('TO service_role');
    expect(writer).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });
});
