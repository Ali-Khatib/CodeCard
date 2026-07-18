import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repo = resolve(__dirname, '../../../../..');
const migration = readFileSync(
  resolve(
    repo,
    'supabase/migrations/20260718012526_ws13_t004_report_resolution.sql',
  ),
  'utf8',
);
const route = readFileSync(
  resolve(repo, 'apps/web/src/app/api/admin/reports/[id]/route.ts'),
  'utf8',
);
const actionModule = readFileSync(
  resolve(repo, 'apps/web/src/lib/admin/moderation-actions.ts'),
  'utf8',
);
const dashboard = readFileSync(
  resolve(repo, 'apps/web/src/components/admin/moderation-dashboard.tsx'),
  'utf8',
);
const reportActions = readFileSync(
  resolve(repo, 'apps/web/src/components/admin/report-actions.tsx'),
  'utf8',
);

describe('WS13-T004 report resolution contracts', () => {
  it('uses one service-role-only atomic transition function', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.admin_transition_moderation_report');
    expect(migration).toContain('SECURITY INVOKER');
    expect(migration).toContain('FOR UPDATE');
    expect(migration).toContain('UPDATE public.moderation_reports');
    expect(migration).toContain('INSERT INTO public.audit_logs');
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.admin_transition_moderation_report(uuid, text, uuid)',
    );
    expect(migration).toContain('FROM PUBLIC, anon, authenticated');
    expect(migration).toContain('TO service_role');
  });

  it('allowlists only pending to resolved/dismissed transitions', () => {
    expect(migration).toContain("p_action = 'resolve'");
    expect(migration).toContain("p_action = 'dismiss'");
    expect(migration).toContain("v_previous_status <> 'pending'");
    expect(migration).toContain("'outcome', 'conflict'");
    expect(migration).toContain("THEN 'idempotent'");
    expect(actionModule).toContain("['resolve', 'dismiss']");
  });

  it('records bounded audit evidence without report or claimant bodies', () => {
    expect(migration).toContain("'moderation_report.resolved'");
    expect(migration).toContain("'moderation_report.dismissed'");
    expect(migration).toContain("'previous_status'");
    expect(migration).toContain("'resulting_status'");
    expect(migration).not.toMatch(/reason|claimant|statement|signature|reporter_user_id/i);
  });

  it('authenticates, authorizes, and checks CSRF before privileged mutation', () => {
    const authorization = route.indexOf('await requireGlobalAdminApiAccess()');
    const csrf = route.indexOf('isSameOriginMutation(request)');
    const mutation = route.indexOf('await transitionModerationReport(');

    expect(authorization).toBeGreaterThanOrEqual(0);
    expect(csrf).toBeGreaterThan(authorization);
    expect(mutation).toBeGreaterThan(csrf);
    expect(route).not.toMatch(/user_metadata|tenant_role|role.*request/i);
  });

  it('keeps content hiding and account suspension out of T004', () => {
    const combined = `${route}\n${actionModule}\n${migration}`;
    expect(combined).not.toMatch(/is_public|is_published|banned_until|updateUserById|suspend/i);
  });

  it('shows actions only for pending reports and never in demo routes', () => {
    expect(dashboard).toContain("report.status === 'pending'");
    expect(dashboard).toContain('<ReportActions');
    expect(dashboard).not.toMatch(/DEMO_|Alex Chen/);
  });

  it('provides confirmation, pending protection, safe feedback, and refresh', () => {
    expect(reportActions).toContain('window.confirm(');
    expect(reportActions).toContain('if (pendingAction) return');
    expect(reportActions).toContain('disabled={pendingAction !== null}');
    expect(reportActions).toContain('Resolve report');
    expect(reportActions).toContain('Dismiss report');
    expect(reportActions).toContain("role={feedback.kind === 'error' ? 'alert' : 'status'}");
    expect(reportActions).toContain('router.refresh()');
    expect(reportActions).not.toMatch(/error\.message|console\./);
  });
});
