import { expect, test } from '@playwright/test';

test.describe('Workspace-first public route alignment', () => {
  test('/ renders the marketing landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByText(/CodeCard|professional|showcase|research/i).first()).toBeVisible();
    await expect(page.getByText('Alex Chen')).toHaveCount(0);
  });

  test('/demo renders the Alex Chen workspace with sidebar', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.getByRole('heading', { name: 'Alex Chen' })).toBeVisible();
    // Desktop: aside sidebar. Mobile: bottom nav. Both must expose workspace destinations.
    const desktopSidebar = page.locator('.cc-app-sidebar');
    const mobileNav = page.getByRole('navigation', { name: 'Mobile' });
    await expect(desktopSidebar.or(mobileNav).first()).toBeAttached();
    await expect(page.getByRole('link', { name: /^Home$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Projects$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Research$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Analytics$/i }).first()).toBeVisible();
  });

  test('/demo/card renders the public Alex Chen profile', async ({ page }) => {
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/demo\/card\/?$/);
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('.cc-app-sidebar')).toHaveCount(0);
  });

  test('/dashboard/preview reaches the workspace demo', async ({ page }) => {
    const response = await page.goto('/dashboard/preview', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.getByRole('heading', { name: 'Alex Chen' })).toBeVisible();
    await expect(
      page.locator('.cc-app-sidebar').or(page.getByRole('navigation', { name: 'Mobile' })).first(),
    ).toBeAttached();
  });

  test('landing Live demo CTA reaches /demo', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const liveDemo = page.getByRole('link', { name: /^Live demo$/i }).first();
    await expect(liveDemo).toHaveAttribute('href', '/demo');
    await liveDemo.click();
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.getByRole('heading', { name: 'Alex Chen' })).toBeVisible();
  });

  /*
   * The landing used to carry "Open live demo workspace" and "View public
   * profile" CTAs. Both were removed: the workspace CTA is now "Open Live Demo"
   * and the public-profile CTA was dropped entirely (cinematic-landing.spec.ts
   * asserts it stays gone). These cover the surviving routing contract.
   */
  test('every "Open Live Demo" CTA on the landing points at /demo', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const ctas = page.getByRole('link', { name: /Open Live Demo/i });
    const count = await ctas.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(ctas.nth(i)).toHaveAttribute('href', /\/demo\/?$/);
    }
  });

  test('landing does not deep-link into the public demo card', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    /* The demo entry point is the workspace; /demo/card is reached from within it. */
    await expect(page.locator('a[href="/demo/card"]')).toHaveCount(0);
  });

  test('/landing permanently redirects to /', async ({ page }) => {
    const response = await page.goto('/landing', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('refreshing /, /demo, and /demo/card keeps destinations', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.getByRole('heading', { name: 'Alex Chen' })).toBeVisible();

    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/demo\/card\/?$/);
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
  });

  test('browser back and forward work without a redirect loop', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.getByRole('heading', { name: 'Alex Chen' })).toBeVisible();

    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await page.goBack();
    await expect(page).toHaveURL(/\/demo\/?$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/demo\/card\/?$/);
  });

  test('repeated / → /demo → / navigation stays stable', async ({ page }) => {
    for (let i = 0; i < 3; i += 1) {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/$/);
      // The landing legitimately previews the demo name in its mobile mockup, so assert
      // only that `/` is not a profile page (no Alex Chen heading).
      await expect(page.getByRole('heading', { name: 'Alex Chen' })).toHaveCount(0);
      await page.goto('/demo', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Alex Chen' })).toBeVisible();
    }
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });
});
