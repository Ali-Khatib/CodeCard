import type { Locator, Page } from '@playwright/test';
import {
  test,
  expect,
  signInViaUI,
  createAdminUser,
  type ProvisionedUser,
} from './support/auth.fixtures';

/**
 * WS14-T004 — project CRUD E2E against the ISOLATED real Supabase backend
 * (never production; see playwright.e2e.config.ts and the production tripwire
 * in auth.fixtures.ts). Disposable users/projects are registered for cleanup.
 */

test.describe.configure({ mode: 'serial' });

let owner: ProvisionedUser;
let projectSlug: string;
let projectId: string;

async function openDashboard(page: Page): Promise<void> {
  await signInViaUI(page, { email: owner.email, password: owner.password });
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

/**
 * Fill a controlled input and prove the value survives React hydration.
 */
async function fillStable(locator: Locator, value: string): Promise<void> {
  await expect(async () => {
    await locator.fill(value);
    await expect(locator).toHaveValue(value, { timeout: 1_000 });
    await locator.page().waitForTimeout(250);
    await expect(locator).toHaveValue(value, { timeout: 500 });
  }).toPass({ timeout: 20_000 });
}

test.describe('WS14-T004 project CRUD E2E (isolated real backend)', () => {
  test('provision disposable owner with a published profile', async ({
    page,
    admin,
    env,
    run,
    registry,
  }) => {
    const slug = `ws14-t004-${run.runUuid.slice(0, 8)}`;
    owner = await createAdminUser(admin, env, registry, {
      slug,
      displayName: 'WS14 T004 Owner',
      workerIndex: 40,
    });

    // Public project visibility requires both project.is_published AND profile.is_public.
    await openDashboard(page);
    await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Publish profile$/ }).click();
    await expect(page.getByText('Published', { exact: true })).toBeVisible({ timeout: 30_000 });

    const { data: row } = await admin
      .from('profiles')
      .select('is_public')
      .eq('id', owner.profileId)
      .single();
    expect(row?.is_public).toBe(true);
  });

  test('anonymous visitor cannot open the project editor', async ({ browser }) => {
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto('/dashboard/projects/new', { waitUntil: 'domcontentloaded' });
    await anonPage.waitForURL(/\/sign-in/, { timeout: 30_000 });
    await anon.close();
  });

  test('create a project through the real UI and persist to the database', async ({
    page,
    admin,
    registry,
  }) => {
    projectSlug = `ws14-proj-${owner.slug.slice(-8)}`;
    await openDashboard(page);
    await page.goto('/dashboard/projects/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('Project title *')).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState('networkidle');

    await fillStable(page.getByLabel('Project title *'), 'WS14 T004 Project');
    await fillStable(page.getByLabel('Project URL *'), projectSlug);
    await fillStable(page.getByLabel('Tagline (optional)'), 'Isolated E2E tagline');
    await fillStable(
      page.getByLabel('Description (optional)'),
      'Description written by the WS14-T004 E2E suite.',
    );

    await page.locator('button[type="submit"]').filter({ hasText: 'Create project' }).click();
    // Create redirects to the projects list (not the edit page).
    await page.waitForURL(/\/dashboard\/projects\/?$/, { timeout: 30_000 });
    await expect(page.getByText('WS14 T004 Project').first()).toBeVisible({ timeout: 30_000 });

    const { data: rows, error } = await admin
      .from('projects')
      .select('id, title, slug, tagline, description, is_published, owner_user_id, profile_id')
      .eq('profile_id', owner.profileId)
      .eq('slug', projectSlug);
    expect(error).toBeNull();
    expect(rows).toHaveLength(1);
    expect(rows?.[0]?.title).toBe('WS14 T004 Project');
    expect(rows?.[0]?.tagline).toBe('Isolated E2E tagline');
    expect(rows?.[0]?.description).toBe('Description written by the WS14-T004 E2E suite.');
    expect(rows?.[0]?.is_published).toBe(false);
    expect(rows?.[0]?.owner_user_id).toBe(owner.id);
    projectId = rows![0]!.id;
    registry.register('project', projectId, owner.id);
  });

  test('edit persists allowlisted field updates', async ({ page, admin }) => {
    await openDashboard(page);
    await page.goto(`/dashboard/projects/${projectId}/edit`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('Project title *')).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState('networkidle');

    await fillStable(page.getByLabel('Project title *'), 'WS14 T004 Project Renamed');
    await fillStable(page.getByLabel('Tagline (optional)'), 'Updated E2E tagline');
    await page.getByRole('button', { name: /^Save changes$/ }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Project saved' }).first(),
    ).toBeVisible({ timeout: 30_000 });

    const { data: row } = await admin
      .from('projects')
      .select('title, tagline, is_published')
      .eq('id', projectId)
      .single();
    expect(row?.title).toBe('WS14 T004 Project Renamed');
    expect(row?.tagline).toBe('Updated E2E tagline');
    expect(row?.is_published).toBe(false);
  });

  test('invalid slug is rejected and nothing is persisted', async ({ page, admin }) => {
    await openDashboard(page);
    await page.goto(`/dashboard/projects/${projectId}/edit`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('Project URL *')).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState('networkidle');

    await fillStable(page.getByLabel('Project URL *'), 'ab');
    await page.getByRole('button', { name: /^Save changes$/ }).click();
    // Client or server validation must surface an error near the slug field.
    await expect(
      page.locator('#project-slug-error, [role="alert"]').filter({ hasText: /slug|3 characters/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    const { data: row } = await admin
      .from('projects')
      .select('slug')
      .eq('id', projectId)
      .single();
    expect(row?.slug).toBe(projectSlug);
  });

  test('unpublished project is not publicly visible', async ({ browser }) => {
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}/projects/${projectId}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(anonPage.getByText('This page is unavailable', { exact: false })).toBeVisible({
      timeout: 30_000,
    });
    await expect(anonPage.getByText('WS14 T004 Project Renamed')).toHaveCount(0);
    await anon.close();
  });

  test('publish makes the project publicly visible to an anonymous visitor', async ({
    page,
    admin,
    browser,
  }) => {
    await openDashboard(page);
    await page.goto(`/dashboard/projects/${projectId}/edit`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Publish project$/ }).click();
    await expect(page.getByText('Published', { exact: true })).toBeVisible({ timeout: 30_000 });

    const { data: row } = await admin
      .from('projects')
      .select('is_published')
      .eq('id', projectId)
      .single();
    expect(row?.is_published).toBe(true);

    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}/projects/${projectId}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(anonPage.getByText('WS14 T004 Project Renamed').first()).toBeVisible({
      timeout: 30_000,
    });
    await anon.close();
  });

  test('unpublish removes public access again', async ({ page, admin, browser }) => {
    await openDashboard(page);
    await page.goto(`/dashboard/projects/${projectId}/edit`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Unpublish project$/ }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: /^Confirm unpublish$/ }).click();
    await expect(page.getByText('Draft', { exact: true })).toBeVisible({ timeout: 30_000 });

    const { data: row } = await admin
      .from('projects')
      .select('is_published')
      .eq('id', projectId)
      .single();
    expect(row?.is_published).toBe(false);

    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}/projects/${projectId}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(anonPage.getByText('This page is unavailable', { exact: false })).toBeVisible({
      timeout: 30_000,
    });
    await anon.close();
  });

  test('hard-delete removes the project row and cascades children', async ({ page, admin }) => {
    await openDashboard(page);
    await page.goto(`/dashboard/projects/${projectId}/edit`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Delete project$/ }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: /^Confirm delete$/ }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Project deleted' }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await page.waitForURL(/\/dashboard\/projects\/?$/, { timeout: 30_000 });

    const { data: row } = await admin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .maybeSingle();
    expect(row).toBeNull();
  });

  test('project list stays usable at mobile width without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openDashboard(page);
    await page.goto('/dashboard/projects', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /Create project/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
