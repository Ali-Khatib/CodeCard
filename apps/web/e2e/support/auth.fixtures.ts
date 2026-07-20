import { test as base, type Page, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadIsolatedE2EEnv, assertNotProductionUrl } from './isolated-e2e';
import { loadMailtrapConfig, cleanupRunMessages } from './mailtrap';
import { createE2ERunIdentity, disposableFixtureEmail, assertAllowedFixtureProfileSlug, type E2ERunIdentity } from '../../src/lib/e2e/run-id';
import {
  E2EFixtureRegistry,
  type FixtureDeleter,
  type FixtureKind,
} from '../../src/lib/e2e/fixture-registry';
import type { ValidatedE2EEnv } from '../../src/lib/e2e/env-guard';

export type ProvisionedUser = {
  id: string;
  email: string;
  slug: string;
  password: string;
  profileId: string;
  tenantId: string;
};

type WorkerFixtures = {
  env: ValidatedE2EEnv;
  admin: SupabaseClient;
  run: E2ERunIdentity;
  registry: E2EFixtureRegistry;
};

type AuthTestFixtures = {
  /** Autouse fixture: attaches the production tripwire to every test's page. */
  productionTripwire: void;
};

/**
 * Deleters bounded to explicitly registered run-scoped IDs. Every deleter
 * tolerates the resource already being gone (e.g. removed by a flow under test)
 * but never performs table-wide or prefix-only deletion.
 */
function makeDeleters(admin: SupabaseClient): Partial<Record<FixtureKind, FixtureDeleter>> {
  return {
    analytics_event: async (f) => {
      const { data, error } = await admin
        .from('analytics_events')
        .delete()
        .eq('id', f.id)
        .select('id');
      if (error) throw new Error(`analytics event cleanup failed: ${error.code}`);
      return data && data.length > 0 ? 'deleted' : 'already_gone';
    },
    storage_object: async (f) => {
      const [bucket, ...rest] = f.id.split('/');
      const { data, error } = await admin.storage.from(bucket).remove([rest.join('/')]);
      if (error) throw new Error(`storage cleanup failed: ${error.message}`);
      return data && data.length > 0 ? 'deleted' : 'already_gone';
    },
    project: async (f) => {
      const { data, error } = await admin.from('projects').delete().eq('id', f.id).select('id');
      if (error) throw new Error(`project cleanup failed: ${error.code}`);
      return data && data.length > 0 ? 'deleted' : 'already_gone';
    },
    research_paper: async (f) => {
      const { data, error } = await admin
        .from('research_papers')
        .delete()
        .eq('id', f.id)
        .select('id');
      if (error) throw new Error(`research cleanup failed: ${error.code}`);
      return data && data.length > 0 ? 'deleted' : 'already_gone';
    },
    profile: async (f) => {
      const { data, error } = await admin.from('profiles').delete().eq('id', f.id).select('id');
      if (error) throw new Error(`profile cleanup failed: ${error.code}`);
      return data && data.length > 0 ? 'deleted' : 'already_gone';
    },
    auth_user: async (f) => {
      const { error } = await admin.auth.admin.deleteUser(f.id);
      if (!error) return 'deleted';
      if (error.status === 404 || /not.?found/i.test(error.message)) return 'already_gone';
      throw new Error(`auth user cleanup failed: ${error.status}`);
    },
    tenant: async (f) => {
      const { data, error } = await admin.from('tenants').delete().eq('id', f.id).select('id');
      if (error) throw new Error(`tenant cleanup failed: ${error.code}`);
      return data && data.length > 0 ? 'deleted' : 'already_gone';
    },
  };
}

export const test = base.extend<AuthTestFixtures, WorkerFixtures>({
  env: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(loadIsolatedE2EEnv());
    },
    { scope: 'worker' },
  ],
  admin: [
    async ({ env }, use) => {
      const client = createClient(env.supabaseUrl, env.serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await use(client);
    },
    { scope: 'worker' },
  ],
  run: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(createE2ERunIdentity());
    },
    { scope: 'worker' },
  ],
  registry: [
    async ({ run, admin }, use) => {
      const registry = new E2EFixtureRegistry(run.runId);
      await use(registry);
      // Worker teardown: clean every registered fixture and report counts.
      const summary = await registry.cleanup(makeDeleters(admin));
      // Also remove captured Mailtrap messages addressed to this run's
      // disposable recipients (bounded to the run ID).
      let mailCleaned = 0;
      const mailtrap = loadMailtrapConfig();
      if (mailtrap) {
        mailCleaned = await cleanupRunMessages(mailtrap, run.runId);
      }
      // eslint-disable-next-line no-console
      console.log(
        `[WS14-T002] cleanup complete: deleted=${summary.deleted} already_gone=${summary.alreadyGone} mail=${mailCleaned} remaining=${registry.size}`,
      );
    },
    { scope: 'worker' },
  ],
  productionTripwire: [
    async ({ page }, use) => {
      // Runtime production tripwire on every request in every test.
      page.on('request', (req) => assertNotProductionUrl(req.url()));
      await use();
    },
    { auto: true },
  ],
});

export { expect };

// ── UI helpers ───────────────────────────────────────────────────────────────

export async function signUpViaUI(
  page: Page,
  fields: { displayName: string; slug: string; email: string; password: string },
): Promise<void> {
  await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();
  await page.getByLabel('Display name').fill(fields.displayName);
  await page.getByLabel('Profile URL').fill(fields.slug);
  await page.getByLabel('Email', { exact: true }).fill(fields.email);
  await page.locator('#password').fill(fields.password);
  await page.getByRole('button', { name: /Create account/i }).click();
}

export async function signInViaUI(
  page: Page,
  fields: { email: string; password: string },
  options: { redirect?: string } = {},
): Promise<void> {
  const path = options.redirect
    ? `/sign-in?redirect=${encodeURIComponent(options.redirect)}`
    : '/sign-in';
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email', { exact: true }).fill(fields.email);
  await page.locator('#password').fill(fields.password);
  await page.getByRole('button', { name: /^Sign in$/i }).click();
}

export async function hasAuthSessionCookie(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some((c) => /^sb-.*-auth-token/.test(c.name) && c.value.length > 0);
}

export async function signOutViaUI(page: Page): Promise<void> {
  await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^Sign out$/i }).click();
  // Synchronize on the actual session invalidation (auth cookies cleared)
  // rather than the post-signout landing render.
  await expect
    .poll(() => hasAuthSessionCookie(page), { timeout: 20_000 })
    .toBe(false);
}

// ── Admin/data helpers ───────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  owner_user_id: string;
  tenant_id: string;
  slug: string;
  display_name: string | null;
  is_public: boolean;
};

export async function waitForProvisionedProfile(
  admin: SupabaseClient,
  slug: string,
  timeoutMs = 25_000,
): Promise<ProfileRow> {
  const deadline = Date.now() + timeoutMs;
  let last: unknown = null;
  while (Date.now() < deadline) {
    const { data, error } = await admin
      .from('profiles')
      .select('id, owner_user_id, tenant_id, slug, display_name, is_public')
      .eq('slug', slug)
      .maybeSingle();
    if (error) last = error.code;
    if (data) return data as ProfileRow;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Profile for slug "${slug}" was not provisioned in time (last=${String(last)})`);
}

/** Register auth user, provisioned profile, and tenant for run-scoped cleanup. */
export function registerUserFixtures(
  registry: E2EFixtureRegistry,
  userId: string,
  profile: ProfileRow,
): void {
  registry.register('auth_user', userId, userId);
  registry.register('profile', profile.id, userId);
  registry.register('tenant', profile.tenant_id, userId);
}

export async function adminConfirmEmail(admin: SupabaseClient, userId: string): Promise<void> {
  const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
  if (error) throw new Error(`admin email confirmation failed: ${error.status}`);
}

export async function isEmailConfirmed(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw new Error(`getUserById failed: ${error.status}`);
  return Boolean(data.user?.email_confirmed_at);
}

export async function getAuthUser(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw new Error(`getUserById failed: ${error.status}`);
  return data.user;
}

/**
 * Create a disposable user administratively (used only where sign-up itself is
 * not the subject, e.g. the second-user isolation test). Never assigns admin
 * metadata. Registers auth user, profile, and tenant for cleanup.
 */
export async function createAdminUser(
  admin: SupabaseClient,
  env: ValidatedE2EEnv,
  registry: E2EFixtureRegistry,
  opts: { slug: string; displayName: string; workerIndex?: number },
): Promise<ProvisionedUser> {
  assertAllowedFixtureProfileSlug(opts.slug);
  const email = disposableFixtureEmail({
    runId: registry.runId,
    workerIndex: opts.workerIndex ?? 1,
    emailDomain: env.emailDomain,
  });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: env.testPassword,
    email_confirm: true,
    user_metadata: { display_name: opts.displayName, slug: opts.slug },
  });
  if (error || !data.user) {
    throw new Error(`admin user creation failed: ${error?.status ?? 'unknown'}`);
  }
  const profile = await waitForProvisionedProfile(admin, opts.slug);
  registerUserFixtures(registry, data.user.id, profile);
  return {
    id: data.user.id,
    email,
    slug: opts.slug,
    password: env.testPassword,
    profileId: profile.id,
    tenantId: profile.tenant_id,
  };
}
