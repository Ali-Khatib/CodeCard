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

  test('Open live demo workspace CTA reaches /demo', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const workspaceCta = page.getByRole('link', { name: /Open live demo workspace/i }).first();
    await expect(workspaceCta).toHaveAttribute('href', '/demo');
  });

  test('public-profile CTA reaches /demo/card', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const profileCta = page.getByRole('link', { name: /View public profile/i }).first();
    await profileCta.scrollIntoViewIfNeeded();
    await expect(profileCta).toHaveAttribute('href', '/demo/card');
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
      await expect(page.getByText('Alex Chen')).toHaveCount(0);
      await page.goto('/demo', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Alex Chen' })).toBeVisible();
    }
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });
});
