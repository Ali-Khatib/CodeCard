/**
 * P0 recovery privilege — stamp is service-role app_metadata only.
 * Clients cannot clear it; complete-password-reset clears after password change.
 */
import { describe, expect, it } from 'vitest';
import {
  PASSWORD_RECOVERY_APP_METADATA_KEY,
  userHasPasswordRecoveryPrivilege,
} from '@/lib/auth/recovery-session';
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

describe('P0 recovery privilege gate signal (isolated)', () => {
  it('stamped recovery privilege blocks until cleared; normal login has none', async () => {
    const env = requireE2EEnvironment();
    expect(env.projectRef).not.toBe(PRODUCTION_SUPABASE_PROJECT_REF);

    const run = createE2ERunIdentity();
    const registry = new E2EFixtureRegistry(run.runId);
    const admin = createE2EAdminClient(env);

    const OLD_PASSWORD = env.testPassword;
    const NEW_PASSWORD = `${env.testPassword}-P0Recov9`;

    const user = await createDisposableUser({ admin, env, registry });
    const profile = await fetchProfileForUser(admin, user.id);
    if (profile?.tenant_id) registry.register('tenant', profile.tenant_id, user.id);

    try {
      const link = await admin.auth.admin.generateLink({ type: 'recovery', email: user.email });
      expect(link.error).toBeNull();
      const tokenHash = link.data.properties?.hashed_token;
      expect(tokenHash).toBeTruthy();

      const recovery = createE2EAnonClient(env);
      const verified = await recovery.auth.verifyOtp({
        type: 'recovery',
        token_hash: tokenHash as string,
      });
      expect(verified.error).toBeNull();
      expect(verified.data.session).not.toBeNull();

      // Simulate trusted callback stamp (service role).
      const stamped = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { [PASSWORD_RECOVERY_APP_METADATA_KEY]: true },
      });
      expect(stamped.error).toBeNull();

      const gated = await recovery.auth.getUser();
      expect(gated.error).toBeNull();
      expect(userHasPasswordRecoveryPrivilege(gated.data.user)).toBe(true);

      // Client cannot clear the privilege via user update.
      const clientClear = await recovery.auth.updateUser({
        data: { [PASSWORD_RECOVERY_APP_METADATA_KEY]: false },
      });
      expect(clientClear.error).toBeNull();
      const stillGated = await recovery.auth.getUser();
      expect(userHasPasswordRecoveryPrivilege(stillGated.data.user)).toBe(true);

      const updated = await recovery.auth.updateUser({ password: NEW_PASSWORD });
      expect(updated.error).toBeNull();

      // Server clear (same as complete-password-reset API) — null deletes the key.
      const cleared = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { [PASSWORD_RECOVERY_APP_METADATA_KEY]: null },
      });
      expect(cleared.error).toBeNull();
      await recovery.auth.signOut({ scope: 'global' });

      const normal = createE2EAnonClient(env);
      const signedIn = await normal.auth.signInWithPassword({
        email: user.email,
        password: NEW_PASSWORD,
      });
      expect(signedIn.error).toBeNull();
      const normalUser = await normal.auth.getUser();
      expect(userHasPasswordRecoveryPrivilege(normalUser.data.user)).toBe(false);

      const oldTry = createE2EAnonClient(env);
      const oldResult = await oldTry.auth.signInWithPassword({
        email: user.email,
        password: OLD_PASSWORD,
      });
      expect(oldResult.error).not.toBeNull();
    } finally {
      const report = await registry.cleanup({
        auth_user: (f) => deleteDisposableAuthUser(admin, f.id),
        tenant: (f) => deleteTenantById(admin, f.id),
      });
      expect(report.deleted).toBeGreaterThanOrEqual(1);
    }
  });
});
