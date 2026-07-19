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
  createE2EAnonClient,
  deleteDisposableAuthUser,
  deleteTenantById,
} from './admin-fixtures';

/**
 * WS14 remediation regression — prove the cross-tenant project/research
 * ownership RLS gap is closed on the isolated E2E backend only.
 *
 * Never contacts production. Privileged admin is used only for fixture
 * setup, narrow inspection, and cleanup — never for ordinary-user
 * enforcement assertions.
 */

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

describe('WS14 project/research tenant-ownership RLS repair (isolated)', () => {
  it('closes the cross-tenant insert exploit while preserving legitimate CRUD and public reads', async () => {
    const env = requireE2EEnvironment();
    expect(env.projectRef).not.toBe(PRODUCTION_SUPABASE_PROJECT_REF);
    expect(env.projectRef.startsWith('zbum')).toBe(true);

    const run = createE2ERunIdentity();
    const registry = new E2EFixtureRegistry(run.runId);
    const admin = createE2EAdminClient(env);
    const anon = createE2EAnonClient(env);

    let victim: Provisioned | null = null;
    let attacker: Provisioned | null = null;
    let legitimateProjectId: string | null = null;
    let draftProjectId: string | null = null;
    let legitimatePaperId: string | null = null;

    try {
      victim = await createProvisionedUser(admin, env, registry, {
        slug: `rls-fix-v-${run.runUuid.slice(0, 8)}`,
        displayName: 'RLS Repair Victim',
        workerIndex: 201,
      });
      attacker = await createProvisionedUser(admin, env, registry, {
        slug: `rls-fix-a-${run.runUuid.slice(0, 8)}`,
        displayName: 'RLS Repair Attacker',
        workerIndex: 202,
      });

      await admin.from('profiles').update({ is_public: true }).eq('id', victim.profileId);

      const attackerClient = userClient(env);
      const signIn = await attackerClient.auth.signInWithPassword({
        email: attacker.email,
        password: env.testPassword,
      });
      expect(signIn.error).toBeNull();

      // ── Exploit regressions (must all fail closed) ─────────────────────
      const forgedVictimProfile = await attackerClient
        .from('projects')
        .insert({
          tenant_id: attacker.tenantId,
          profile_id: victim.profileId,
          owner_user_id: attacker.id,
          title: 'FORGED VICTIM PROFILE PROJECT',
          is_published: true,
        })
        .select('id');
      expect(forgedVictimProfile.error).toBeTruthy();
      expect(forgedVictimProfile.data ?? []).toHaveLength(0);

      const forgedVictimTenant = await attackerClient
        .from('projects')
        .insert({
          tenant_id: victim.tenantId,
          profile_id: attacker.profileId,
          owner_user_id: attacker.id,
          title: 'FORGED VICTIM TENANT PROJECT',
          is_published: true,
        })
        .select('id');
      expect(forgedVictimTenant.error).toBeTruthy();
      expect(forgedVictimTenant.data ?? []).toHaveLength(0);

      const forgedBoth = await attackerClient
        .from('projects')
        .insert({
          tenant_id: victim.tenantId,
          profile_id: victim.profileId,
          owner_user_id: attacker.id,
          title: 'FORGED CROSS-TENANT PROJECT',
          is_published: true,
        })
        .select('id');
      expect(forgedBoth.error).toBeTruthy();
      expect(forgedBoth.data ?? []).toHaveLength(0);

      const forgedOwnerClaim = await attackerClient
        .from('projects')
        .insert({
          tenant_id: victim.tenantId,
          profile_id: victim.profileId,
          owner_user_id: victim.id,
          title: 'FORGED OWNER CLAIM',
          is_published: true,
        })
        .select('id');
      expect(forgedOwnerClaim.error).toBeTruthy();
      expect(forgedOwnerClaim.data ?? []).toHaveLength(0);

      const forgedResearchProfile = await attackerClient
        .from('research_papers')
        .insert({
          tenant_id: attacker.tenantId,
          profile_id: victim.profileId,
          owner_user_id: attacker.id,
          slug: `forged-res-${run.runUuid.slice(0, 8)}`,
          title: 'FORGED RESEARCH PROFILE',
          authors: ['Attacker'],
          is_published: true,
        })
        .select('id');
      expect(forgedResearchProfile.error).toBeTruthy();
      expect(forgedResearchProfile.data ?? []).toHaveLength(0);

      const forgedResearchTenant = await attackerClient
        .from('research_papers')
        .insert({
          tenant_id: victim.tenantId,
          profile_id: attacker.profileId,
          owner_user_id: attacker.id,
          slug: `forged-res-t-${run.runUuid.slice(0, 8)}`,
          title: 'FORGED RESEARCH TENANT',
          authors: ['Attacker'],
          is_published: true,
        })
        .select('id');
      expect(forgedResearchTenant.error).toBeTruthy();
      expect(forgedResearchTenant.data ?? []).toHaveLength(0);

      // Anonymous must see zero forged projects on the victim profile.
      const anonForged = await anon
        .from('projects')
        .select('id')
        .eq('profile_id', victim.profileId)
        .eq('is_published', true);
      expect(anonForged.data ?? []).toHaveLength(0);

      // Cross-tenant UPDATE/UPSERT remain rejected.
      const victimClient = userClient(env);
      await victimClient.auth.signInWithPassword({
        email: victim.email,
        password: env.testPassword,
      });
      const { data: victimOwned } = await victimClient
        .from('projects')
        .insert({
          tenant_id: victim.tenantId,
          profile_id: victim.profileId,
          owner_user_id: victim.id,
          title: 'Victim Owned For Update Probe',
          is_published: false,
        })
        .select('id')
        .single();
      expect(victimOwned?.id).toBeTruthy();
      registry.register('project', victimOwned!.id, victim.id);
      draftProjectId = victimOwned!.id;

      const crossUpdate = await attackerClient
        .from('projects')
        .update({ title: 'HACKED' })
        .eq('id', victimOwned!.id)
        .select('id');
      expect(crossUpdate.data ?? []).toHaveLength(0);

      const crossUpsert = await attackerClient
        .from('projects')
        .upsert({
          id: victimOwned!.id,
          tenant_id: victim.tenantId,
          profile_id: victim.profileId,
          owner_user_id: attacker.id,
          title: 'HACKED UPSERT',
          is_published: true,
        })
        .select('id');
      expect(crossUpsert.error).toBeTruthy();

      // Existing sibling protections still hold.
      const forgedLink = await attackerClient
        .from('profile_links')
        .insert({
          tenant_id: victim.tenantId,
          profile_id: victim.profileId,
          type: 'website',
          url: 'https://evil.example',
          sort_order: 0,
        })
        .select('id');
      expect(forgedLink.error).toBeTruthy();

      // ── Legitimate CRUD still works for the owner ──────────────────────
      const { data: legitProject, error: legitProjectErr } = await victimClient
        .from('projects')
        .insert({
          tenant_id: victim.tenantId,
          profile_id: victim.profileId,
          owner_user_id: victim.id,
          title: 'Legitimate Published Project',
          is_published: true,
        })
        .select('id')
        .single();
      expect(legitProjectErr).toBeNull();
      expect(legitProject?.id).toBeTruthy();
      const ownedProjectId = legitProject!.id;
      legitimateProjectId = ownedProjectId;
      registry.register('project', ownedProjectId, victim.id);

      const { data: updated, error: updateErr } = await victimClient
        .from('projects')
        .update({ title: 'Legitimate Published Project Updated' })
        .eq('id', ownedProjectId)
        .select('title')
        .single();
      expect(updateErr).toBeNull();
      expect(updated?.title).toBe('Legitimate Published Project Updated');

      const { data: legitPaper, error: legitPaperErr } = await victimClient
        .from('research_papers')
        .insert({
          tenant_id: victim.tenantId,
          profile_id: victim.profileId,
          owner_user_id: victim.id,
          slug: `legit-${run.runUuid.slice(0, 8)}`,
          title: 'Legitimate Published Paper',
          authors: ['Victim'],
          is_published: true,
        })
        .select('id')
        .single();
      expect(legitPaperErr).toBeNull();
      expect(legitPaper?.id).toBeTruthy();
      const ownedPaperId = legitPaper!.id;
      legitimatePaperId = ownedPaperId;
      registry.register('research_paper', ownedPaperId, victim.id);

      // Public visibility: published readable, draft hidden.
      const anonPublished = await anon
        .from('projects')
        .select('id, title')
        .eq('id', ownedProjectId)
        .maybeSingle();
      expect(anonPublished.data?.id).toBe(ownedProjectId);

      const anonDraft = await anon
        .from('projects')
        .select('id')
        .eq('id', draftProjectId)
        .maybeSingle();
      expect(anonDraft.data).toBeNull();

      const anonPaper = await anon
        .from('research_papers')
        .select('id')
        .eq('id', ownedPaperId)
        .maybeSingle();
      expect(anonPaper.data?.id).toBe(ownedPaperId);

      // Owner delete still works.
      const { error: delPaperErr } = await victimClient
        .from('research_papers')
        .delete()
        .eq('id', ownedPaperId);
      expect(delPaperErr).toBeNull();
      legitimatePaperId = null;

      const { error: delProjectErr } = await victimClient
        .from('projects')
        .delete()
        .eq('id', ownedProjectId);
      expect(delProjectErr).toBeNull();
      legitimateProjectId = null;

      await attackerClient.auth.signOut();
      await victimClient.auth.signOut();
    } finally {
      // Explicit cleanup for any leftover content, then registry cleanup.
      if (legitimateProjectId) {
        await admin.from('projects').delete().eq('id', legitimateProjectId);
      }
      if (draftProjectId) {
        await admin.from('projects').delete().eq('id', draftProjectId);
      }
      if (legitimatePaperId) {
        await admin.from('research_papers').delete().eq('id', legitimatePaperId);
      }

      const summary = await registry.cleanup({
        project: async (f) => {
          const { data, error } = await admin
            .from('projects')
            .delete()
            .eq('id', f.id)
            .select('id');
          if (error) throw new Error(error.code);
          return data && data.length > 0 ? 'deleted' : 'already_gone';
        },
        research_paper: async (f) => {
          const { data, error } = await admin
            .from('research_papers')
            .delete()
            .eq('id', f.id)
            .select('id');
          if (error) throw new Error(error.code);
          return data && data.length > 0 ? 'deleted' : 'already_gone';
        },
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

      expect(registry.size).toBe(0);
      expect(summary.deleted + summary.alreadyGone).toBeGreaterThan(0);

      // Zero leftover probe projects/papers for the disposable users.
      if (victim) {
        const { count: leftoverProjects } = await admin
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('owner_user_id', victim.id);
        const { count: leftoverPapers } = await admin
          .from('research_papers')
          .select('id', { count: 'exact', head: true })
          .eq('owner_user_id', victim.id);
        expect(leftoverProjects ?? 0).toBe(0);
        expect(leftoverPapers ?? 0).toBe(0);
      }
    }
  });
});
