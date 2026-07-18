import { describe, expect, it } from 'vitest';
import { requireE2EEnvironment, PRODUCTION_SUPABASE_PROJECT_REF } from './env-guard';
import { createE2ERunIdentity } from './run-id';
import { E2EFixtureRegistry } from './fixture-registry';
import {
  authUserIsGone,
  createDisposableUser,
  createE2EAdminClient,
  deleteDisposableAuthUser,
  deleteTenantById,
  fetchProfileForUser,
} from './admin-fixtures';

/**
 * WS14 minimal isolated smoke validation.
 *
 * Proves the isolated environment and fixture lifecycle work end to end:
 * guard → disposable user → profile provisioning → registered cleanup →
 * nothing left behind. It intentionally creates no project/research content
 * and never exercises the account-deletion UI.
 */

describe('WS14 isolated E2E smoke validation', () => {
  it('creates and fully cleans one disposable user against the isolated backend', async () => {
    // 1–2. Guard passes and the target is not production.
    const env = requireE2EEnvironment();
    expect(env.projectRef).not.toBe(PRODUCTION_SUPABASE_PROJECT_REF);

    const run = createE2ERunIdentity();
    const registry = new E2EFixtureRegistry(run.runId);
    const admin = createE2EAdminClient(env);

    // 3. Create one disposable Auth user administratively.
    const user = await createDisposableUser({ admin, env, registry });
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.email.startsWith('codecard-e2e+')).toBe(true);

    // 4–5. Signup provisioning created exactly this user's profile; read it.
    const profile = await fetchProfileForUser(admin, user.id);
    expect(profile).not.toBeNull();
    expect(profile?.owner_user_id).toBe(user.id);
    expect(profile?.is_public).toBe(false);

    // Provisioning also creates a tenant; register it for cleanup.
    if (profile?.tenant_id) {
      registry.register('tenant', profile.tenant_id, user.id);
    }

    // 6. Delete through the fixture cleanup registry.
    const report = await registry.cleanup({
      auth_user: (fixture) => deleteDisposableAuthUser(admin, fixture.id),
      tenant: (fixture) => deleteTenantById(admin, fixture.id),
    });
    expect(report.deleted).toBeGreaterThanOrEqual(1);

    // 7. Confirm the Auth user is gone.
    expect(await authUserIsGone(admin, user.id)).toBe(true);

    // 8. Confirm no registered artifacts remain.
    expect(registry.size).toBe(0);
    const remainingProfile = await fetchProfileForUser(admin, user.id);
    expect(remainingProfile).toBeNull();
  });
});
