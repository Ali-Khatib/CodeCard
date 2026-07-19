import { describe, expect, it } from 'vitest';
import { requireE2EEnvironment, PRODUCTION_SUPABASE_PROJECT_REF } from './env-guard';
import { createE2ERunIdentity } from './run-id';
import { E2EFixtureRegistry } from './fixture-registry';
import {
  createDisposableUser,
  createE2EAdminClient,
  createE2EAnonClient,
  deleteDisposableAuthUser,
  deleteTenantById,
  fetchProfileForUser,
} from './admin-fixtures';

/**
 * WS14-T002 password-reset COMPLETION contract against the isolated backend.
 *
 * Real email DELIVERY is out of scope (the disposable mailbox domain is a
 * reserved, non-deliverable domain and the isolated project uses the default
 * email service with no capture). This test therefore obtains a REAL recovery
 * token WITHOUT sending an email (admin generateLink), establishes a recovery
 * session via verifyOtp, updates the password through the Supabase client
 * (the same `updateUser({ password })` contract the UI uses), and proves the
 * old password is rejected while the new password works. It does NOT perform an
 * administrative password write and call it a reset.
 */
describe('WS14 password-reset completion (isolated backend, no email delivery)', () => {
  it('recovery session permits a password update; old password fails and new works', async () => {
    const env = requireE2EEnvironment();
    expect(env.projectRef).not.toBe(PRODUCTION_SUPABASE_PROJECT_REF);

    const run = createE2ERunIdentity();
    const registry = new E2EFixtureRegistry(run.runId);
    const admin = createE2EAdminClient(env);

    const OLD_PASSWORD = env.testPassword;
    const NEW_PASSWORD = `${env.testPassword}-Rotated9`;

    const user = await createDisposableUser({ admin, env, registry });
    const profile = await fetchProfileForUser(admin, user.id);
    if (profile?.tenant_id) registry.register('tenant', profile.tenant_id, user.id);

    try {
      // Sanity: the disposable account can sign in with the original password.
      const before = createE2EAnonClient(env);
      const beforeResult = await before.auth.signInWithPassword({
        email: user.email,
        password: OLD_PASSWORD,
      });
      expect(beforeResult.error).toBeNull();
      expect(beforeResult.data.session).not.toBeNull();

      // Obtain a genuine recovery token without sending email.
      const link = await admin.auth.admin.generateLink({ type: 'recovery', email: user.email });
      expect(link.error).toBeNull();
      const tokenHash = link.data.properties?.hashed_token;
      expect(tokenHash, 'recovery token hash present').toBeTruthy();

      // Establish the recovery session and update the password via the client.
      const recovery = createE2EAnonClient(env);
      const verified = await recovery.auth.verifyOtp({
        type: 'recovery',
        token_hash: tokenHash as string,
      });
      expect(verified.error).toBeNull();
      expect(verified.data.session, 'recovery session established').not.toBeNull();

      const updated = await recovery.auth.updateUser({ password: NEW_PASSWORD });
      expect(updated.error).toBeNull();

      // Old password now rejected.
      const oldTry = createE2EAnonClient(env);
      const oldResult = await oldTry.auth.signInWithPassword({
        email: user.email,
        password: OLD_PASSWORD,
      });
      expect(oldResult.error).not.toBeNull();
      expect(oldResult.data.session).toBeNull();

      // New password accepted.
      const newTry = createE2EAnonClient(env);
      const newResult = await newTry.auth.signInWithPassword({
        email: user.email,
        password: NEW_PASSWORD,
      });
      expect(newResult.error).toBeNull();
      expect(newResult.data.session).not.toBeNull();
    } finally {
      const report = await registry.cleanup({
        auth_user: (f) => deleteDisposableAuthUser(admin, f.id),
        tenant: (f) => deleteTenantById(admin, f.id),
      });
      expect(report.deleted).toBeGreaterThanOrEqual(1);
      expect(registry.size).toBe(0);
    }
  });
});
