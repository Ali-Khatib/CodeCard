import type { Page } from '@playwright/test';
import {
  test,
  expect,
  signInViaUI,
  createAdminUser,
  type ProvisionedUser,
} from './support/auth.fixtures';
/**
 * WS14-T006 — public profile, sharing and QR E2E against the ISOLATED real
 * Supabase backend (never production). Disposable users are cleaned up via
 * the run-scoped registry.
 */

test.describe.configure({ mode: 'serial' });

const NO_VISITOR_PROMPT = '[class*="cc-visitor-prompt"]';

let owner: ProvisionedUser;

async function openDashboard(page: Page): Promise<void> {
  await signInViaUI(page, { email: owner.email, password: owner.password });
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

test.describe('WS14-T006 public profile, sharing and QR E2E (isolated real backend)', () => {
  test('provision disposable owner (profile starts unpublished)', async ({
    admin,
    env,
    run,
    registry,
  }) => {
    const slug = `ws14-t006-${run.runUuid.slice(0, 8)}`;
    owner = await createAdminUser(admin, env, registry, {
      slug,
      displayName: 'WS14 T006 Owner',
      workerIndex: 60,
    });

    const { data: row } = await admin
      .from('profiles')
      .select('is_public, display_name')
      .eq('id', owner.profileId)
      .single();
    expect(row?.is_public).toBe(false);
    expect(row?.display_name).toBe('WS14 T006 Owner');
  });

  test('unpublished profile is not publicly visible', async ({ browser }) => {
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}`, { waitUntil: 'domcontentloaded' });
    await expect(anonPage.getByText('This page is unavailable', { exact: false })).toBeVisible({
      timeout: 30_000,
    });
    await expect(anonPage.getByText('WS14 T006 Owner')).toHaveCount(0);
    await anon.close();
  });

  test('publish makes the public profile visible to an anonymous visitor', async ({
    page,
    admin,
    browser,
  }) => {
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

    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}`, { waitUntil: 'domcontentloaded' });
    await expect(anonPage.getByText('WS14 T006 Owner').first()).toBeVisible({ timeout: 30_000 });
    // Visitor conversion must never appear on public profiles.
    await expect(anonPage.locator(NO_VISITOR_PROMPT)).toHaveCount(0);
    await anon.close();
  });

  test('anonymous visitor can copy the public profile link', async ({ browser }) => {
    const anon = await browser.newContext();
    await anon.grantPermissions(['clipboard-read', 'clipboard-write']);
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}`, { waitUntil: 'domcontentloaded' });
    await expect(anonPage.getByText('WS14 T006 Owner').first()).toBeVisible({ timeout: 30_000 });

    await anonPage.getByRole('button', { name: /^Copy link$/ }).first().click();
    await expect(
      anonPage.getByRole('button', { name: /Profile link copied/i }).first(),
    ).toBeVisible({ timeout: 10_000 });

    const clipboard = await anonPage.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain(`/${owner.slug}`);
    // Copy link must stay untagged (QR alone adds ?source=qr).
    expect(clipboard).not.toContain('source=qr');
    await anon.close();
  });

  test('anonymous view records a public_profile_events row', async ({ admin, browser }) => {
    const before = await admin
      .from('public_profile_events')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', owner.profileId);

    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}`, { waitUntil: 'networkidle' });
    await expect(anonPage.getByText('WS14 T006 Owner').first()).toBeVisible({ timeout: 30_000 });
    await anon.close();

    await expect
      .poll(
        async () => {
          const after = await admin
            .from('public_profile_events')
            .select('id', { count: 'exact', head: true })
            .eq('profile_id', owner.profileId);
          return (after.count ?? 0) - (before.count ?? 0);
        },
        { timeout: 30_000 },
      )
      .toBeGreaterThanOrEqual(1);
  });

  test('dashboard share hero: copy public link and download QR for the canonical URL', async ({
    page,
  }) => {
    await openDashboard(page);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const copyBtn = page.getByRole('button', { name: 'Copy public link' }).first();
    await expect(copyBtn).toBeVisible({ timeout: 30_000 });
    await copyBtn.click();
    await expect(
      page.getByRole('button', { name: /Public link copied|Copy public link/i }).first(),
    ).toBeVisible({ timeout: 10_000 });

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    // Canonical URL is baked from NEXT_PUBLIC_APP_URL at build time — assert
    // the path/slug and that it is NOT tagged with the QR source marker.
    expect(clipboard).toMatch(new RegExp(`^https?://[^/]+/${owner.slug}$`));
    expect(clipboard).not.toContain('source=qr');

    // Open the real QR panel (not the decorative public-page fake QR).
    await page.getByRole('button', { name: 'Show profile QR code' }).click();
    await expect(page.locator('#profile-qr')).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByAltText(new RegExp(`QR code for public CodeCard profile .*/${owner.slug}$`)),
    ).toBeVisible({ timeout: 30_000 });
    // Encoded destination includes the approved source=qr marker.
    await expect(page.getByText(new RegExp(`/${owner.slug}\\?source=qr$`))).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Download QR as PNG' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`codecard-${owner.slug}-qr.png`);
  });

  test('QR-sourced anonymous visit is recorded with source=qr', async ({ admin, browser }) => {
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}?source=qr`, { waitUntil: 'networkidle' });
    await expect(anonPage.getByText('WS14 T006 Owner').first()).toBeVisible({ timeout: 30_000 });
    await anon.close();

    await expect
      .poll(
        async () => {
          const { data } = await admin
            .from('public_profile_events')
            .select('source')
            .eq('profile_id', owner.profileId)
            .eq('source', 'qr')
            .limit(1);
          return data?.length ?? 0;
        },
        { timeout: 30_000 },
      )
      .toBeGreaterThanOrEqual(1);
  });

  test('public profile stays usable at mobile width without horizontal overflow', async ({
    browser,
  }) => {
    const anon = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const anonPage = await anon.newPage();
    await anonPage.goto(`/${owner.slug}`, { waitUntil: 'domcontentloaded' });
    await expect(anonPage.getByText('WS14 T006 Owner').first()).toBeVisible({ timeout: 30_000 });
    const overflow = await anonPage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await anon.close();
  });
});
