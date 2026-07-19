import { describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  requireE2EEnvironment,
  PRODUCTION_SUPABASE_PROJECT_REF,
  type ValidatedE2EEnv,
} from './env-guard';
import { createE2ERunIdentity, disposableFixtureEmail } from './run-id';
import { resolveGlobalAdminAuthorization } from '../security/admin-authorization';
import { E2EFixtureRegistry } from './fixture-registry';
import {
  createE2EAdminClient,
  createE2EAnonClient,
  deleteDisposableAuthUser,
  deleteTenantById,
} from './admin-fixtures';

/**
 * WS14-T010 — real RLS integration against the isolated E2E Supabase project.
 *
 * Assertions use anonymous / owner / foreign authenticated clients.
 * The privileged admin client is used only for fixture setup, narrow
 * inspection, and cleanup — never for ordinary-user enforcement claims.
 */

type Provisioned = {
  id: string;
  email: string;
  profileId: string;
  tenantId: string;
  slug: string;
};

const PNG = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  ),
);

function userClient(env: ValidatedE2EEnv): SupabaseClient {
  return createClient(env.supabaseUrl, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function waitForProfile(admin: SupabaseClient, slug: string) {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    const { data } = await admin
      .from('profiles')
      .select('id, tenant_id, owner_user_id, is_public')
      .eq('slug', slug)
      .maybeSingle();
    if (data) return data;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`profile ${slug} not provisioned`);
}

async function provision(
  admin: SupabaseClient,
  env: ValidatedE2EEnv,
  registry: E2EFixtureRegistry,
  opts: { slug: string; displayName: string; workerIndex: number; appMetadata?: Record<string, unknown> },
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
    ...(opts.appMetadata ? { app_metadata: opts.appMetadata } : {}),
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.status}`);
  const profile = await waitForProfile(admin, opts.slug);
  registry.register('auth_user', data.user.id, data.user.id);
  registry.register('profile', profile.id, data.user.id);
  registry.register('tenant', profile.tenant_id, data.user.id);
  return {
    id: data.user.id,
    email,
    profileId: profile.id,
    tenantId: profile.tenant_id,
    slug: opts.slug,
  };
}

describe('WS14-T010 RLS integration (isolated real backend)', () => {
  it('enforces anonymous, owner, foreign-user, admin-claim and storage matrices', async () => {
    const env = requireE2EEnvironment();
    expect(env.projectRef).not.toBe(PRODUCTION_SUPABASE_PROJECT_REF);
    expect(env.projectRef.startsWith('zbum')).toBe(true);

    const run = createE2ERunIdentity();
    const registry = new E2EFixtureRegistry(run.runId);
    const admin = createE2EAdminClient(env);
    const anon = createE2EAnonClient(env);

    let owner: Provisioned | null = null;
    let foreign: Provisioned | null = null;
    let publishedProjectId: string | null = null;
    let draftProjectId: string | null = null;
    let publishedPaperId: string | null = null;
    let draftPaperId: string | null = null;
    let avatarPath: string | null = null;
    let privateDocPath: string | null = null;

    try {
      owner = await provision(admin, env, registry, {
        slug: `ws14-t010-${run.runUuid.slice(0, 8)}`,
        displayName: 'WS14 T010 Owner',
        workerIndex: 210,
      });
      foreign = await provision(admin, env, registry, {
        slug: `ws14-t010f-${run.runUuid.slice(0, 8)}`,
        displayName: 'WS14 T010 Foreign',
        workerIndex: 211,
        // Ordinary fixtures never receive admin metadata; this user forges a
        // client-visible claim later and must still be treated as non-admin.
      });

      // Seed content via admin (fixture setup only).
      await admin.from('profiles').update({ is_public: true, headline: 'Owner headline' }).eq('id', owner.profileId);

      const { data: pubProject } = await admin
        .from('projects')
        .insert({
          tenant_id: owner.tenantId,
          profile_id: owner.profileId,
          owner_user_id: owner.id,
          title: 'T010 Published',
          is_published: true,
        })
        .select('id')
        .single();
      expect(pubProject?.id).toBeTruthy();
      publishedProjectId = pubProject!.id;
      registry.register('project', pubProject!.id, owner.id);

      const { data: draftProject } = await admin
        .from('projects')
        .insert({
          tenant_id: owner.tenantId,
          profile_id: owner.profileId,
          owner_user_id: owner.id,
          title: 'T010 Draft',
          is_published: false,
        })
        .select('id')
        .single();
      expect(draftProject?.id).toBeTruthy();
      draftProjectId = draftProject!.id;
      registry.register('project', draftProject!.id, owner.id);

      const { data: pubPaper } = await admin
        .from('research_papers')
        .insert({
          tenant_id: owner.tenantId,
          profile_id: owner.profileId,
          owner_user_id: owner.id,
          slug: `t010-pub-${run.runUuid.slice(0, 8)}`,
          title: 'T010 Published Paper',
          authors: ['Owner'],
          is_published: true,
        })
        .select('id')
        .single();
      expect(pubPaper?.id).toBeTruthy();
      publishedPaperId = pubPaper!.id;
      registry.register('research_paper', pubPaper!.id, owner.id);

      const { data: draftPaper } = await admin
        .from('research_papers')
        .insert({
          tenant_id: owner.tenantId,
          profile_id: owner.profileId,
          owner_user_id: owner.id,
          slug: `t010-draft-${run.runUuid.slice(0, 8)}`,
          title: 'T010 Draft Paper',
          authors: ['Owner'],
          is_published: false,
        })
        .select('id')
        .single();
      expect(draftPaper?.id).toBeTruthy();
      draftPaperId = draftPaper!.id;
      registry.register('research_paper', draftPaper!.id, owner.id);

      const { data: link } = await admin
        .from('profile_links')
        .insert({
          tenant_id: owner.tenantId,
          profile_id: owner.profileId,
          type: 'github',
          url: 'https://github.com/codecard-e2e',
          sort_order: 0,
        })
        .select('id')
        .single();
      registry.register('profile_link', link!.id, owner.id);

      // ── Anonymous matrix ───────────────────────────────────────────────
      const anonProfile = await anon
        .from('profiles')
        .select('id, display_name, is_public')
        .eq('id', owner.profileId)
        .maybeSingle();
      expect(anonProfile.data?.is_public).toBe(true);

      const anonPublished = await anon
        .from('projects')
        .select('id')
        .eq('id', publishedProjectId)
        .maybeSingle();
      expect(anonPublished.data?.id).toBe(publishedProjectId);

      const anonDraft = await anon.from('projects').select('id').eq('id', draftProjectId).maybeSingle();
      expect(anonDraft.data).toBeNull();

      const anonPaper = await anon
        .from('research_papers')
        .select('id')
        .eq('id', publishedPaperId)
        .maybeSingle();
      expect(anonPaper.data?.id).toBe(publishedPaperId);

      const anonDraftPaper = await anon
        .from('research_papers')
        .select('id')
        .eq('id', draftPaperId)
        .maybeSingle();
      expect(anonDraftPaper.data).toBeNull();

      const anonLinks = await anon
        .from('profile_links')
        .select('id')
        .eq('profile_id', owner.profileId);
      expect((anonLinks.data ?? []).length).toBeGreaterThan(0);

      const anonWrite = await anon
        .from('profiles')
        .update({ display_name: 'HACK' })
        .eq('id', owner.profileId)
        .select('id');
      expect(anonWrite.data ?? []).toHaveLength(0);

      const anonAnalytics = await anon
        .from('analytics_events')
        .select('id')
        .eq('profile_id', owner.profileId);
      expect(anonAnalytics.data ?? []).toHaveLength(0);

      const anonSubs = await anon.from('subscriptions').select('id').limit(1);
      expect(anonSubs.data ?? []).toHaveLength(0);

      // ── Owner matrix ───────────────────────────────────────────────────
      const ownerClient = userClient(env);
      await ownerClient.auth.signInWithPassword({
        email: owner.email,
        password: env.testPassword,
      });

      const ownerDraftRead = await ownerClient
        .from('projects')
        .select('id, title')
        .eq('id', draftProjectId)
        .maybeSingle();
      expect(ownerDraftRead.data?.id).toBe(draftProjectId);

      const ownerUpdate = await ownerClient
        .from('profiles')
        .update({ headline: 'Updated by owner' })
        .eq('id', owner.profileId)
        .select('headline')
        .single();
      expect(ownerUpdate.error).toBeNull();
      expect(ownerUpdate.data?.headline).toBe('Updated by owner');

      const ownerProject = await ownerClient
        .from('projects')
        .insert({
          tenant_id: owner.tenantId,
          profile_id: owner.profileId,
          owner_user_id: owner.id,
          title: 'Owner created',
          is_published: false,
        })
        .select('id')
        .single();
      expect(ownerProject.error).toBeNull();
      registry.register('project', ownerProject.data!.id, owner.id);

      const ownerAnalyticsInsert = await ownerClient.from('analytics_events').insert({
        tenant_id: owner.tenantId,
        profile_id: owner.profileId,
        target_type: 'profile',
        target_id: owner.profileId,
        event_type: 'profile_view',
      });
      // Insert allowed for public profile targets.
      expect(ownerAnalyticsInsert.error).toBeNull();

      // Ordinary disposable users must not carry the global-admin claim.
      const { data: ownerAuth } = await admin.auth.admin.getUserById(owner.id);
      expect(ownerAuth.user?.app_metadata?.role).not.toBe('admin');
      expect(
        resolveGlobalAdminAuthorization({
          userId: owner.id,
          appMetadata: (ownerAuth.user?.app_metadata as Record<string, unknown>) ?? null,
        }).authorized,
      ).toBe(false);
      // Wrong-case / array role shapes fail closed.
      expect(
        resolveGlobalAdminAuthorization({
          userId: owner.id,
          appMetadata: { role: 'Admin' },
        }).authorized,
      ).toBe(false);
      expect(
        resolveGlobalAdminAuthorization({
          userId: owner.id,
          appMetadata: { role: ['admin'] },
        }).authorized,
      ).toBe(false);

      // ── Foreign authenticated matrix ───────────────────────────────────
      const foreignClient = userClient(env);
      await foreignClient.auth.signInWithPassword({
        email: foreign.email,
        password: env.testPassword,
      });

      const foreignSeesPublished = await foreignClient
        .from('projects')
        .select('id')
        .eq('id', publishedProjectId)
        .maybeSingle();
      expect(foreignSeesPublished.data?.id).toBe(publishedProjectId);

      const foreignSeesDraft = await foreignClient
        .from('projects')
        .select('id')
        .eq('id', draftProjectId)
        .maybeSingle();
      expect(foreignSeesDraft.data).toBeNull();

      const foreignUpdate = await foreignClient
        .from('profiles')
        .update({ display_name: 'HACKED' })
        .eq('id', owner.profileId)
        .select('id');
      expect(foreignUpdate.data ?? []).toHaveLength(0);

      const foreignProjectMutate = await foreignClient
        .from('projects')
        .update({ title: 'HACKED' })
        .eq('id', publishedProjectId)
        .select('id');
      expect(foreignProjectMutate.data ?? []).toHaveLength(0);

      const foreignDelete = await foreignClient
        .from('projects')
        .delete()
        .eq('id', publishedProjectId)
        .select('id');
      expect(foreignDelete.data ?? []).toHaveLength(0);

      // Cross-tenant insert exploit must remain closed (repair regression).
      const forgedInsert = await foreignClient
        .from('projects')
        .insert({
          tenant_id: owner.tenantId,
          profile_id: owner.profileId,
          owner_user_id: foreign.id,
          title: 'FORGED',
          is_published: true,
        })
        .select('id');
      expect(forgedInsert.error).toBeTruthy();
      expect(forgedInsert.data ?? []).toHaveLength(0);

      const forgedResearch = await foreignClient
        .from('research_papers')
        .insert({
          tenant_id: owner.tenantId,
          profile_id: owner.profileId,
          owner_user_id: foreign.id,
          slug: `forged-${run.runUuid.slice(0, 8)}`,
          title: 'FORGED RESEARCH',
          authors: ['Foreign'],
          is_published: true,
        })
        .select('id');
      expect(forgedResearch.error).toBeTruthy();

      const foreignAnalytics = await foreignClient
        .from('analytics_events')
        .select('id')
        .eq('profile_id', owner.profileId);
      expect(foreignAnalytics.data ?? []).toHaveLength(0);

      const foreignLink = await foreignClient
        .from('profile_links')
        .insert({
          tenant_id: owner.tenantId,
          profile_id: owner.profileId,
          type: 'website',
          url: 'https://evil.example',
          sort_order: 99,
        })
        .select('id');
      expect(foreignLink.error).toBeTruthy();

      // Unpublish removes anonymous access.
      await ownerClient
        .from('projects')
        .update({ is_published: false })
        .eq('id', publishedProjectId);
      const anonAfterUnpublish = await anon
        .from('projects')
        .select('id')
        .eq('id', publishedProjectId)
        .maybeSingle();
      expect(anonAfterUnpublish.data).toBeNull();
      // Restore for storage tests below.
      await ownerClient
        .from('projects')
        .update({ is_published: true })
        .eq('id', publishedProjectId);

      // ── Storage RLS matrix ─────────────────────────────────────────────
      avatarPath = `${owner.tenantId}/${owner.id}/avatar/${owner.profileId}/${crypto.randomUUID()}.png`;
      const ownerUpload = await ownerClient.storage
        .from('avatars')
        .upload(avatarPath, PNG, { contentType: 'image/png' });
      expect(ownerUpload.error).toBeNull();
      registry.register('storage_object', `avatars/${avatarPath}`, owner.id);

      const anonAvatar = await anon.storage.from('avatars').download(avatarPath);
      expect(anonAvatar.error).toBeNull();

      const foreignAvatarWrite = await foreignClient.storage
        .from('avatars')
        .upload(
          `${owner.tenantId}/${owner.id}/avatar/${owner.profileId}/${crypto.randomUUID()}.png`,
          PNG,
          { contentType: 'image/png' },
        );
      expect(foreignAvatarWrite.error).toBeTruthy();

      const foreignAvatarDelete = await foreignClient.storage.from('avatars').remove([avatarPath]);
      void foreignAvatarDelete;
      const stillThere = await admin.storage.from('avatars').download(avatarPath);
      expect(stillThere.error).toBeNull();

      privateDocPath = `${owner.tenantId}/${owner.id}/private-doc/${publishedPaperId}/${crypto.randomUUID()}.pdf`;
      // Plant private doc via admin (user private-doc uploads are product-disabled).
      const plant = await admin.storage
        .from('private-docs')
        .upload(privateDocPath, Buffer.from('%PDF-1.4\n%%EOF\n'), {
          contentType: 'application/pdf',
        });
      expect(plant.error).toBeNull();
      registry.register('storage_object', `private-docs/${privateDocPath}`, owner.id);

      const anonPrivate = await anon.storage.from('private-docs').download(privateDocPath);
      expect(anonPrivate.error).toBeTruthy();

      const foreignPrivate = await foreignClient.storage
        .from('private-docs')
        .download(privateDocPath);
      expect(foreignPrivate.error).toBeTruthy();

      const anonListPrivate = await anon.storage
        .from('private-docs')
        .list(`${owner.tenantId}/${owner.id}/private-doc/${publishedPaperId}`);
      expect(anonListPrivate.data ?? []).toHaveLength(0);

      // ── Admin claim matrix (application resolver; RLS is not admin-gated) ─
      // Forged user_metadata / client role must not authorize.
      expect(
        resolveGlobalAdminAuthorization({
          userId: foreign.id,
          appMetadata: { role: 'user' },
        }).authorized,
      ).toBe(false);
      const { data: foreignAuth } = await admin.auth.admin.getUserById(foreign.id);
      expect(foreignAuth.user?.app_metadata?.role).not.toBe('admin');

      await ownerClient.auth.signOut();
      await foreignClient.auth.signOut();
    } finally {
      // Bounded cleanup for analytics rows created during the run (not always
      // individually registered when insert returns no id).
      if (owner) {
        await admin.from('analytics_events').delete().eq('profile_id', owner.profileId);
        await admin.from('public_profile_events').delete().eq('profile_id', owner.profileId);
      }

      const summary = await registry.cleanup({
        storage_object: async (f) => {
          const [bucket, ...rest] = f.id.split('/');
          const { data, error } = await admin.storage.from(bucket).remove([rest.join('/')]);
          if (error) throw new Error(error.message);
          return data && data.length > 0 ? 'deleted' : 'already_gone';
        },
        analytics_event: async (f) => {
          const { data, error } = await admin
            .from('analytics_events')
            .delete()
            .eq('id', f.id)
            .select('id');
          if (error) throw new Error(error.code);
          return data && data.length > 0 ? 'deleted' : 'already_gone';
        },
        profile_link: async (f) => {
          const { data, error } = await admin
            .from('profile_links')
            .delete()
            .eq('id', f.id)
            .select('id');
          if (error) throw new Error(error.code);
          return data && data.length > 0 ? 'deleted' : 'already_gone';
        },
        project: async (f) => {
          const { data, error } = await admin.from('projects').delete().eq('id', f.id).select('id');
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
          const { data, error } = await admin.from('profiles').delete().eq('id', f.id).select('id');
          if (error) throw new Error(error.code);
          return data && data.length > 0 ? 'deleted' : 'already_gone';
        },
        auth_user: (f) => deleteDisposableAuthUser(admin, f.id),
        tenant: (f) => deleteTenantById(admin, f.id),
      });

      expect(registry.size).toBe(0);
      expect(summary.deleted + summary.alreadyGone).toBeGreaterThan(0);
    }
  });
});
