/**
 * P0 billing tenant isolation — live RLS regression on isolated E2E only.
 *
 * Proves User A cannot insert subscription_customers for Tenant B, while a
 * legitimate own-tenant insert still succeeds.
 */
import { describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  requireE2EEnvironment,
  PRODUCTION_SUPABASE_PROJECT_REF,
} from './env-guard';
import { createE2ERunIdentity, disposableFixtureEmail } from './run-id';
import { E2EFixtureRegistry } from './fixture-registry';
import {
  createE2EAdminClient,
  deleteDisposableAuthUser,
  deleteTenantById,
} from './admin-fixtures';

type Provisioned = {
  id: string;
  email: string;
  profileId: string;
  tenantId: string;
};

async function waitForProfile(
  admin: SupabaseClient,
  slug: string,
  timeoutMs = 25_000,
): Promise<{ id: string; tenant_id: string; owner_user_id: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data } = await admin
      .from('profiles')
      .select('id, tenant_id, owner_user_id')
      .eq('slug', slug)
      .maybeSingle();
    if (data) return data;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`profile for slug ${slug} not provisioned`);
}

async function createProvisionedUser(
  admin: SupabaseClient,
  env: ReturnType<typeof requireE2EEnvironment>,
  registry: E2EFixtureRegistry,
  opts: { slug: string; displayName: string; workerIndex: number },
): Promise<Provisioned> {
  const email = disposableFixtureEmail({
    runId: registry.runId,
    workerIndex: opts.workerIndex,
    emailDomain: env.emailDomain,
  });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: env.testPassword,
    email_confirm: true,
    user_metadata: { display_name: opts.displayName, slug: opts.slug },
  });
  if (error || !data.user) {
    throw new Error(`user create failed: ${error?.status ?? 'unknown'}`);
  }
  const profile = await waitForProfile(admin, opts.slug);
  registry.register('auth_user', data.user.id, data.user.id);
  registry.register('profile', profile.id, data.user.id);
  registry.register('tenant', profile.tenant_id, data.user.id);
  return {
    id: data.user.id,
    email,
    profileId: profile.id,
    tenantId: profile.tenant_id,
  };
}

function userClient(env: ReturnType<typeof requireE2EEnvironment>): SupabaseClient {
  return createClient(env.supabaseUrl, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe('P0 subscription_customers tenant-bound INSERT (isolated)', () => {
  it('denies cross-tenant mapping insert; allows own-tenant insert', async () => {
    const env = requireE2EEnvironment();
    expect(env.projectRef).not.toBe(PRODUCTION_SUPABASE_PROJECT_REF);
    expect(env.projectRef.startsWith('zbum')).toBe(true);

    const run = createE2ERunIdentity();
    const registry = new E2EFixtureRegistry(run.runId);
    const admin = createE2EAdminClient(env);

    let victim: Provisioned | null = null;
    let attacker: Provisioned | null = null;

    try {
      victim = await createProvisionedUser(admin, env, registry, {
        slug: `p0bill-v-${run.runId.slice(0, 8)}`,
        displayName: 'P0 Victim',
        workerIndex: 0,
      });
      attacker = await createProvisionedUser(admin, env, registry, {
        slug: `p0bill-a-${run.runId.slice(0, 8)}`,
        displayName: 'P0 Attacker',
        workerIndex: 1,
      });

      expect(attacker.tenantId).not.toBe(victim.tenantId);

      const attackerClient = userClient(env);
      const signedIn = await attackerClient.auth.signInWithPassword({
        email: attacker.email,
        password: env.testPassword,
      });
      expect(signedIn.error).toBeNull();
      expect(signedIn.data.session).not.toBeNull();

      const poison = await attackerClient.from('subscription_customers').insert({
        user_id: attacker.id,
        tenant_id: victim.tenantId,
        stripe_customer_id: `cus_p0_poison_${run.runId}`,
      });
      expect(poison.error, 'cross-tenant INSERT must be denied').not.toBeNull();

      const { data: poisonRows } = await admin
        .from('subscription_customers')
        .select('tenant_id')
        .eq('stripe_customer_id', `cus_p0_poison_${run.runId}`);
      expect(poisonRows ?? []).toHaveLength(0);

      const legit = await attackerClient.from('subscription_customers').insert({
        user_id: attacker.id,
        tenant_id: attacker.tenantId,
        stripe_customer_id: `cus_p0_legit_${run.runId}`,
      });
      expect(legit.error, 'own-tenant INSERT must be allowed').toBeNull();

      const { data: legitRows } = await admin
        .from('subscription_customers')
        .select('user_id, tenant_id')
        .eq('stripe_customer_id', `cus_p0_legit_${run.runId}`);
      expect(legitRows).toHaveLength(1);
      expect(legitRows?.[0]?.user_id).toBe(attacker.id);
      expect(legitRows?.[0]?.tenant_id).toBe(attacker.tenantId);

      await admin
        .from('subscription_customers')
        .delete()
        .eq('stripe_customer_id', `cus_p0_legit_${run.runId}`);
    } finally {
      const report = await registry.cleanup({
        profile: async (f) => {
          const { data, error } = await admin
            .from('profiles')
            .delete()
            .eq('id', f.id)
            .select('id');
          if (error) throw new Error(error.code);
          return data && data.length > 0 ? 'deleted' : 'already_gone';
        },
        auth_user: (f) => deleteDisposableAuthUser(admin, f.id),
        tenant: (f) => deleteTenantById(admin, f.id),
      });
      expect(report.deleted).toBeGreaterThanOrEqual(1);
    }
  });
});
