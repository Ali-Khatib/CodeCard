import type { Locator, Page } from '@playwright/test';
import {
  test,
  expect,
  signInViaUI,
  createAdminUser,
  type ProvisionedUser,
} from './support/auth.fixtures';

/**
 * WS14-T005 — research CRUD E2E against the ISOLATED real Supabase backend
 * (never production). Disposable users/papers are registered for cleanup.
 */

test.describe.configure({ mode: 'serial' });

let owner: ProvisionedUser;
let paperSlug: string;
let paperId: string;

async function openDashboard(page: Page): Promise<void> {
  await signInViaUI(page, { email: owner.email, password: owner.password });
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

async function fillStable(locator: Locator, value: string): Promise<void> {
  await expect(async () => {
    await locator.fill(value);
    await expect(locator).toHaveValue(value, { timeout: 1_000 });
    await locator.page().waitForTimeout(250);
    await expect(locator).toHaveValue(value, { timeout: 500 });
  }).toPass({ timeout: 20_000 });
}

/**
 * Open an inline confirmation panel and return once its Confirm button is
 * visible. On slow CI runners a click can land before React hydration attaches
 * the onClick handler (so the panel never opens); retrying after hydration
 * settles is the reliable fix. We assert on the Confirm button rather than the
 * alertdialog role because CI's Linux Chromium exposes the inline
 * role="alertdialog" panel as an "alert" node, which getByRole('alertdialog')
 * does not match.
 */
async function openConfirmPanel(
  page: Page,
  trigger: Locator,
  confirm: RegExp,
): Promise<void> {
  await page.waitForLoadState('networkidle');
  await expect(async () => {
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(page.getByRole('button', { name: confirm })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

test.describe('WS14-T005 research CRUD E2E (isolated real backend)', () => {
  test('provision disposable owner with a published profile', async ({
    page,
    admin,
    env,
    run,
    registry,
  }) => {
    const slug = `ws14-t005-${run.runUuid.slice(0, 8)}`;
    owner = await createAdminUser(admin, env, registry, {
      slug,
      displayName: 'WS14 T005 Owner',
      workerIndex: 50,
    });

    await openDashboard(page);
    await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Publish profile$/ }).click();
    await expect(page.getByText('Published', { exact: true })).toBeVisible({ timeout: 30_000 });
  });

  test('anonymous visitor cannot open the research editor', async ({ browser }) => {
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto('/dashboard/research/new', { waitUntil: 'domcontentloaded' });
    await anonPage.waitForURL(/\/sign-in/, { timeout: 30_000 });
    await anon.close();
  });

  test('create a research paper through the real UI and persist to the database', async ({
    page,
    admin,
    registry,
  }) => {
    paperSlug = `ws14-paper-${owner.slug.slice(-8)}`;
    await openDashboard(page);
    await page.goto('/dashboard/research/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('research-form')).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState('networkidle');

    await fillStable(page.getByLabel(/^Title$/), 'WS14 T005 Research Paper');
    await fillStable(page.getByLabel(/^URL slug$/), paperSlug);
    await fillStable(
      page.getByLabel(/^Abstract$/),
      'Abstract written by the WS14-T005 E2E suite.',
    );
    await fillStable(page.getByLabel('Author 1', { exact: true }), 'Ada Lovelace');

    await page
      .locator('[data-testid="research-form"] button[type="submit"]')
      .filter({ hasText: 'Create research paper' })
      .click();
    // Create redirects to the edit page (not the list).
    await page.waitForURL(/\/dashboard\/research\/[^/]+\/edit$/, { timeout: 30_000 });
    await expect(page.getByText('WS14 T005 Research Paper').first()).toBeVisible({
      timeout: 30_000,
    });

    const { data: rows, error } = await admin
      .from('research_papers')
      .select('id, title, slug, abstract, is_published, owner_user_id, profile_id, authors')
      .eq('profile_id', owner.profileId)
      .eq('slug', paperSlug);
    expect(error).toBeNull();
    expect(rows).toHaveLength(1);
    expect(rows?.[0]?.title).toBe('WS14 T005 Research Paper');
    expect(rows?.[0]?.abstract).toBe('Abstract written by the WS14-T005 E2E suite.');
    expect(rows?.[0]?.is_published).toBe(false);
    expect(rows?.[0]?.owner_user_id).toBe(owner.id);
    expect(rows?.[0]?.authors).toContain('Ada Lovelace');
    paperId = rows![0]!.id;
    registry.register('research_paper', paperId, owner.id);
  });

  test('edit persists allowlisted field updates', async ({ page, admin }) => {
    await openDashboard(page);
    await page.goto(`/dashboard/research/${paperId}/edit`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('research-form')).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState('networkidle');

    await fillStable(page.getByLabel(/^Title$/), 'WS14 T005 Research Paper Renamed');
    await fillStable(page.getByLabel(/^Venue$/), 'Isolated E2E Venue');
    await page
      .locator('[data-testid="research-form"] button[type="submit"]')
      .filter({ hasText: 'Save changes' })
      .click();
    await expect(
      page.getByRole('status').filter({ hasText: /Research paper saved|saved/i }).first(),
    ).toBeVisible({ timeout: 30_000 });

    const { data: row } = await admin
      .from('research_papers')
      .select('title, venue, is_published')
      .eq('id', paperId)
      .single();
    expect(row?.title).toBe('WS14 T005 Research Paper Renamed');
    expect(row?.venue).toBe('Isolated E2E Venue');
    expect(row?.is_published).toBe(false);
  });

  test('invalid slug is rejected and nothing is persisted', async ({ page, admin }) => {
    await openDashboard(page);
    await page.goto(`/dashboard/research/${paperId}/edit`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel(/^URL slug$/)).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState('networkidle');

    await fillStable(page.getByLabel(/^URL slug$/), 'ab');
    await page
      .locator('[data-testid="research-form"] button[type="submit"]')
      .filter({ hasText: 'Save changes' })
      .click();
    await expect(
      page.locator('[role="alert"]').filter({ hasText: /slug|3 characters/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    const { data: row } = await admin
      .from('research_papers')
      .select('slug')
      .eq('id', paperId)
      .single();
    expect(row?.slug).toBe(paperSlug);
  });

  test('unpublished research is not publicly visible', async ({ browser }) => {
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}/research/${paperSlug}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(anonPage.getByText('This page is unavailable', { exact: false })).toBeVisible({
      timeout: 30_000,
    });
    await expect(anonPage.getByText('WS14 T005 Research Paper Renamed')).toHaveCount(0);
    await anon.close();
  });

  test('publish makes the research publicly visible to an anonymous visitor', async ({
    page,
    admin,
    browser,
  }) => {
    await openDashboard(page);
    await page.goto(`/dashboard/research/${paperId}/edit`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Publish research$/ }).click();
    await expect(page.getByText('Published', { exact: true })).toBeVisible({ timeout: 30_000 });

    const { data: row } = await admin
      .from('research_papers')
      .select('is_published')
      .eq('id', paperId)
      .single();
    expect(row?.is_published).toBe(true);

    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}/research/${paperSlug}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(anonPage.getByText('WS14 T005 Research Paper Renamed').first()).toBeVisible({
      timeout: 30_000,
    });
    await anon.close();
  });

  test('unpublish removes public access again', async ({ page, admin, browser }) => {
    await openDashboard(page);
    await page.goto(`/dashboard/research/${paperId}/edit`, { waitUntil: 'domcontentloaded' });
    await openConfirmPanel(
      page,
      page.getByRole('button', { name: /^Unpublish research$/ }),
      /^Confirm unpublish$/,
    );
    await page.getByRole('button', { name: /^Confirm unpublish$/ }).click();
    await expect(page.getByText('Draft', { exact: true })).toBeVisible({ timeout: 30_000 });

    const { data: row } = await admin
      .from('research_papers')
      .select('is_published')
      .eq('id', paperId)
      .single();
    expect(row?.is_published).toBe(false);

    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}/research/${paperSlug}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(anonPage.getByText('This page is unavailable', { exact: false })).toBeVisible({
      timeout: 30_000,
    });
    await anon.close();
  });

  test('hard-delete removes the research paper row', async ({ page, admin }) => {
    await openDashboard(page);
    await page.goto(`/dashboard/research/${paperId}/edit`, { waitUntil: 'domcontentloaded' });
    // Accessible name includes the paper title; visible text is "Delete research paper".
    const deleteTrigger = page.getByRole('button', { name: /^Delete research paper/ });
    await openConfirmPanel(page, deleteTrigger, /^Confirm delete/);
    await page.getByRole('button', { name: /^Confirm delete/ }).click();
    await expect(
      page.getByRole('status').filter({ hasText: /Research paper deleted|deleted/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await page.waitForURL(/\/dashboard\/research\/?$/, { timeout: 30_000 });

    const { data: row } = await admin
      .from('research_papers')
      .select('id')
      .eq('id', paperId)
      .maybeSingle();
    expect(row).toBeNull();
  });

  test('research list stays usable at mobile width without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openDashboard(page);
    await page.goto('/dashboard/research', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /Add research/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
