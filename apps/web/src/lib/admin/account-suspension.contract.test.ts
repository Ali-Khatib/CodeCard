import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repo = resolve(__dirname, '../../../../..');
const migration = readFileSync(
  resolve(repo, 'supabase/migrations/20260718020932_ws13_t006_account_suspension.sql'),
  'utf8',
);
const helper = readFileSync(
  resolve(repo, 'apps/web/src/lib/admin/account-suspension.ts'),
  'utf8',
);
const route = readFileSync(
  resolve(repo, 'apps/web/src/app/api/admin/users/[id]/suspend/route.ts'),
  'utf8',
);
const actions = readFileSync(
  resolve(repo, 'apps/web/src/components/admin/report-actions.tsx'),
  'utf8',
);
const profilePublish = readFileSync(
  resolve(repo, 'apps/web/src/lib/profile/profile-publish-core.ts'),
  'utf8',
);
const projectPublish = readFileSync(
  resolve(repo, 'apps/web/src/lib/projects/project-publish-core.ts'),
  'utf8',
);
const researchPublish = readFileSync(
  resolve(repo, 'apps/web/src/lib/research/research-publish-core.ts'),
  'utf8',
);

describe('WS13-T006 account suspension contracts', () => {
  it('creates a durable private suspension marker and publish-block triggers', () => {
    expect(migration).toContain('CREATE TABLE public.account_suspensions');
    expect(migration).toContain('FORCE ROW LEVEL SECURITY');
    expect(migration).toContain(
      'REVOKE ALL ON TABLE public.account_suspensions FROM PUBLIC, anon, authenticated',
    );
    expect(migration).toContain("RAISE EXCEPTION 'account_suspended'");
    expect(migration).toContain('profiles_suspension_publish_block');
    expect(migration).toContain('projects_suspension_publish_block');
    expect(migration).toContain('research_suspension_publish_block');
    expect(migration).not.toMatch(/DELETE FROM auth\.users|deleteUser\(/);
  });

  it('prepares DB state before Auth ban and documents partial-failure audit actions', () => {
    expect(helper).toContain('admin_prepare_account_suspension');
    expect(helper).toContain('updateUserById');
    expect(helper).toContain('ban_duration');
    expect(helper).toContain('user.suspension_partial');
    expect(helper).toContain('Billing/Stripe is intentionally unchanged');
    expect(helper).toContain('self_suspension');
    expect(helper).toContain('last_admin');
    expect(helper).toContain('demo_identity');
    expect(helper).toContain('service_identity');
  });

  it('authorizes and enforces CSRF before suspension', () => {
    const auth = route.indexOf('await requireGlobalAdminApiAccess()');
    const csrf = route.indexOf('isSameOriginMutation(request)');
    const mutation = route.indexOf('await suspendAccount(');

    expect(auth).toBeGreaterThanOrEqual(0);
    expect(csrf).toBeGreaterThan(auth);
    expect(mutation).toBeGreaterThan(csrf);
    expect(route).toContain('authorization.userId');
    expect(route).not.toMatch(/parsed\.data\.actorUserId|user_metadata|tenant_role/);
  });

  it('blocks suspended users on all publish cores', () => {
    expect(profilePublish).toContain('isCurrentAccountSuspended');
    expect(projectPublish).toContain('isCurrentAccountSuspended');
    expect(researchPublish).toContain('isCurrentAccountSuspended');
    expect(profilePublish).toMatch(/suspended and cannot publish/i);
    expect(projectPublish).toMatch(/suspended and cannot publish/i);
    expect(researchPublish).toMatch(/suspended and cannot publish/i);
  });

  it('exposes a guarded admin UI action distinct from deletion', () => {
    expect(actions).toContain('Suspend account');
    expect(actions).toContain('window.confirm(');
    expect(actions).toContain('does not delete the account or cancel billing');
    expect(actions).toContain('/api/admin/users/');
    expect(actions).toContain('pendingAction === \'suspend\'');
    expect(actions).not.toMatch(/DEMO_|Alex Chen|deleteUser/);
  });
});
