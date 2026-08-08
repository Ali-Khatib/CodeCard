import type { Locator, Page } from '@playwright/test';
import {
  test,
  expect,
  signInViaUI,
  createAdminUser,
  type ProvisionedUser,
} from './support/auth.fixtures';

/**
 * WS14-T003 — profile edit and publishing E2E against the ISOLATED real
 * Supabase backend (never production; see playwright.e2e.config.ts and the
 * production tripwire in auth.fixtures.ts).
 *
 * Covers: dashboard navigation to the canonical editor, field edits with real
 * persistence, validation, profile links CRUD with host validation, avatar
 * upload through the real signed-URL flow, publish/unpublish with anonymous
 * visibility checks, and access control. All disposable users, rows, and
 * storage objects are registered for run-scoped cleanup.
 */

test.describe.configure({ mode: 'serial' });

const AVATAR_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

let owner: ProvisionedUser;
/** Current slug of the owner (updated by the slug-change test). */
let currentSlug: string;

/** Each test gets a fresh context, so sign in and open the canonical editor. */
async function openProfileEditor(page: Page): Promise<void> {
  await signInViaUI(page, { email: owner.email, password: owner.password });
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Display name')).toBeVisible({ timeout: 30_000 });
  // Give hydration a chance to settle before typing into controlled inputs.
  await page.waitForLoadState('networkidle');
}

/**
 * Fill a controlled input and prove the value survives React hydration.
 * A fill that lands before hydration is wiped when React re-renders with its
 * own state, so re-check after a settle window and refill if needed.
 */
async function fillStable(locator: Locator, value: string): Promise<void> {
  await expect(async () => {
    await locator.fill(value);
    await expect(locator).toHaveValue(value, { timeout: 1_000 });
    await locator.page().waitForTimeout(250);
    await expect(locator).toHaveValue(value, { timeout: 500 });
  }).toPass({ timeout: 20_000 });
}

test.describe('WS14-T003 profile edit and publishing E2E (isolated real backend)', () => {
  test('provision disposable owner and reach the canonical profile editor from Home', async ({
    page,
    admin,
    env,
    run,
    registry,
  }) => {
    currentSlug = `ws14-t003-${run.runUuid.slice(0, 8)}`;
    owner = await createAdminUser(admin, env, registry, {
      slug: currentSlug,
      displayName: 'WS14 T003 Owner',
      workerIndex: 30,
    });

    await signInViaUI(page, { email: owner.email, password: owner.password });
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    // Profile stays off primary nav; Home "Edit profile" is the entry.
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /profile/i })).toHaveCount(0);
    await page.getByRole('link', { name: /^Edit profile$/ }).click();
    await page.waitForURL(/\/dashboard\/profile$/, { timeout: 30_000 });
    await expect(page.getByLabel('Display name')).toBeVisible();
  });

  test('anonymous visitor cannot open the profile editor', async ({ browser }) => {
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto('/dashboard/profile', { waitUntil: 'domcontentloaded' });
    await anonPage.waitForURL(/\/sign-in/, { timeout: 30_000 });
    await expect(anonPage.getByLabel('Email', { exact: true })).toBeVisible();
    await anon.close();
  });

  test('edits persist to the real database with accessible save feedback', async ({
    page,
    admin,
  }) => {
    await openProfileEditor(page);

    await fillStable(page.getByLabel('Display name'), 'WS14 T003 Renamed');
    await fillStable(page.getByLabel('Headline'), 'Isolated E2E headline');
    await fillStable(page.getByLabel(/^Bio/), 'Bio written by the WS14-T003 E2E suite.');
    await fillStable(page.getByLabel('Location'), 'Test City, TC');
    await fillStable(page.getByLabel(/^Skills/), 'TypeScript, Playwright');

    await page.locator('button[type="submit"]').filter({ hasText: 'Save changes' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Profile saved' }).first()).toBeVisible({
      timeout: 30_000,
    });

    const { data: row, error } = await admin
      .from('profiles')
      .select('display_name, headline, bio, location, skills, slug, is_public')
      .eq('id', owner.profileId)
      .single();
    expect(error).toBeNull();
    expect(row?.display_name).toBe('WS14 T003 Renamed');
    expect(row?.headline).toBe('Isolated E2E headline');
    expect(row?.bio).toBe('Bio written by the WS14-T003 E2E suite.');
    expect(row?.location).toBe('Test City, TC');
    expect(row?.skills).toEqual(['TypeScript', 'Playwright']);
    expect(row?.slug).toBe(currentSlug);
    expect(row?.is_public).toBe(false);
  });

  test('invalid slug is rejected client-side and nothing is persisted', async ({
    page,
    admin,
  }) => {
    await openProfileEditor(page);

    // The slug input lowercases on change; spaces and punctuation still fail validation.
    // On slow CI runners a submit click can land before hydration wires the
    // onSubmit handler, so re-fill and re-submit inside the retry. The editor
    // surfaces the slug validation message either inline (#slug-error) or via
    // the fallback role="alert" region depending on which submit path handled
    // it, so assert the accessible message itself rather than one specific node.
    await page.waitForLoadState('networkidle');
    const slugInput = page.getByLabel('Profile URL');
    await expect(async () => {
      await fillStable(slugInput, 'invalid slug!!');
      await page.locator('button[type="submit"]').filter({ hasText: 'Save changes' }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Slug must be lowercase alphanumeric with hyphens' })
          .first(),
      ).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 30_000 });

    const { data: row } = await admin
      .from('profiles')
      .select('slug')
      .eq('id', owner.profileId)
      .single();
    expect(row?.slug).toBe(currentSlug);
  });

  test('slug change persists and updates the canonical profile URL', async ({ page, admin }) => {
    const nextSlug = `${currentSlug}-r`;
    await openProfileEditor(page);
    await fillStable(page.getByLabel('Profile URL'), nextSlug);
    await page.locator('button[type="submit"]').filter({ hasText: 'Save changes' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Profile saved' }).first()).toBeVisible({
      timeout: 30_000,
    });

    const { data: row } = await admin
      .from('profiles')
      .select('slug')
      .eq('id', owner.profileId)
      .single();
    expect(row?.slug).toBe(nextSlug);
    currentSlug = nextSlug;
  });

  test('profile links: host validation rejects mismatched URL, valid link persists', async ({
    page,
    admin,
  }) => {
    await openProfileEditor(page);

    await page.getByRole('button', { name: /^Add link$/ }).click();
    await page.getByLabel('Type', { exact: true }).selectOption('github');

    // A LinkedIn URL under the GitHub type must be rejected.
    await page.getByLabel('URL', { exact: true }).fill('https://www.linkedin.com/in/ws14-e2e');
    await page.getByRole('button', { name: /^Save link$/ }).click();
    await expect(page.locator('#profile-link-url-error')).toBeVisible({ timeout: 20_000 });

    // Correcting to a real GitHub URL saves and renders in the list.
    await page.getByLabel('URL', { exact: true }).fill('https://github.com/ws14-e2e');
    await page.getByRole('button', { name: /^Save link$/ }).click();
    await expect(
      page.getByRole('listitem').filter({ hasText: 'github.com/ws14-e2e' }),
    ).toBeVisible({ timeout: 30_000 });

    const { data: links, error } = await admin
      .from('profile_links')
      .select('type, url')
      .eq('profile_id', owner.profileId);
    expect(error).toBeNull();
    expect(links).toHaveLength(1);
    expect(links?.[0]?.type).toBe('github');
    expect(links?.[0]?.url).toBe('https://github.com/ws14-e2e');
  });

  test('profile link can be deleted through the UI', async ({ page, admin }) => {
    await openProfileEditor(page);
    const linkItem = page.getByRole('listitem').filter({ hasText: 'github.com/ws14-e2e' });
    await expect(linkItem).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await linkItem.getByRole('button', { name: /^Delete$/ }).click();
    await expect(linkItem).toHaveCount(0, { timeout: 30_000 });

    const { data: links } = await admin
      .from('profile_links')
      .select('id')
      .eq('profile_id', owner.profileId);
    expect(links).toHaveLength(0);
  });

  test('avatar uploads through the real signed-URL flow and persists', async ({
    page,
    admin,
    registry,
  }) => {
    await openProfileEditor(page);

    const upload = page.getByTestId('avatar-upload');
    await upload.locator('input[type="file"]').setInputFiles({
      name: 'ws14-avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from(AVATAR_PNG_BASE64, 'base64'),
    });
    await upload.getByRole('button', { name: /^Upload (photo|replacement)$/ }).click();

    await expect(upload.getByRole('status').filter({ hasText: /Avatar saved/ })).toBeVisible({
      timeout: 45_000,
    });

    const { data: row, error } = await admin
      .from('profiles')
      .select('avatar_url')
      .eq('id', owner.profileId)
      .single();
    expect(error).toBeNull();
    expect(row?.avatar_url).toBeTruthy();

    // Register the uploaded object for run-scoped storage cleanup.
    const marker = '/storage/v1/object/public/';
    const url = String(row?.avatar_url);
    expect(url).toContain(marker);
    const objectId = url.slice(url.indexOf(marker) + marker.length).split('?')[0];
    registry.register('storage_object', decodeURIComponent(objectId), owner.id);
  });

  test('unpublished profile is not publicly visible', async ({ browser }) => {
    // The [slug] route streams (loading.tsx), so the HTTP status is 200 and the
    // not-found UI is streamed in; assert on rendered content instead.
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${currentSlug}`, { waitUntil: 'domcontentloaded' });
    await expect(anonPage.getByText('This page is unavailable', { exact: false })).toBeVisible({
      timeout: 30_000,
    });
    await expect(anonPage.getByText('WS14 T003 Renamed')).toHaveCount(0);
    await anon.close();
  });

  test('publish makes the profile publicly visible to an anonymous visitor', async ({
    page,
    admin,
    browser,
  }) => {
    await openProfileEditor(page);
    await page.getByRole('button', { name: /^Publish profile$/ }).click();
    await expect(page.getByText('Published', { exact: true })).toBeVisible({ timeout: 30_000 });

    const { data: row } = await admin
      .from('profiles')
      .select('is_public')
      .eq('id', owner.profileId)
      .single();
    expect(row?.is_public).toBe(true);

    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${currentSlug}`, { waitUntil: 'domcontentloaded' });
    await expect(anonPage.getByText('WS14 T003 Renamed').first()).toBeVisible({
      timeout: 30_000,
    });
    await anon.close();
  });

  test('unpublish removes public access again', async ({ page, admin, browser }) => {
    await openProfileEditor(page);
    // Assert on Confirm unpublish rather than alertdialog: CI's Linux Chromium
    // exposes the inline role="alertdialog" panel as a status/alert node.
    await expect(async () => {
      await page.getByRole('button', { name: /^Unpublish profile$/ }).click();
      await expect(page.getByRole('button', { name: /^Confirm unpublish$/ })).toBeVisible({
        timeout: 2_000,
      });
    }).toPass({ timeout: 30_000 });
    await page.getByRole('button', { name: /^Confirm unpublish$/ }).click();
    await expect(page.getByText('Unpublished', { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    const { data: row } = await admin
      .from('profiles')
      .select('is_public')
      .eq('id', owner.profileId)
      .single();
    expect(row?.is_public).toBe(false);

    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${currentSlug}`, { waitUntil: 'domcontentloaded' });
    await expect(anonPage.getByText('This page is unavailable', { exact: false })).toBeVisible({
      timeout: 30_000,
    });
    await expect(anonPage.getByText('WS14 T003 Renamed')).toHaveCount(0);
    await anon.close();
  });

  test('profile editor stays usable at mobile width without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProfileEditor(page);
    await expect(
      page.locator('button[type="submit"]').filter({ hasText: 'Save changes' }),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
