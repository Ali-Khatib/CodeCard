import { expect, test } from '@playwright/test';

test.describe('Phase 0D public critical rendering path', () => {
  test('landing HTML contains LCP headline before hydration waits', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();

    const html = await page.content();
    expect(html).toMatch(/data-hero-statement/);
    expect(html).toMatch(/YOUR WORK/);
    expect(html).toMatch(/ONE IDENTITY/);
    expect(html).not.toMatch(/supabase\.auth\.getSession/);

    await expect(page.locator('[data-hero-statement]').first()).toBeVisible();
    // Native scroll until (optional) Lenis boots — content must not be hidden.
    await expect(page.locator('main')).toBeVisible();

    const hydrationErrors = errors.filter((e) => /hydration/i.test(e));
    expect(hydrationErrors).toEqual([]);
  });

  test('demo HTML contains bio LCP text in the initial document', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    expect(html).toMatch(/Alex Chen/);
    // Bio is server-rendered profile copy (class utilities may shift; assert content).
    expect(html).toMatch(/I ship tools that help teams move faster/);

    // Greeting heading is visible at every viewport; the sidebar summary collapses on mobile.
    await expect(page.locator('h1.cc-profile-home__title')).toBeVisible();
    expect(errors.filter((e) => /hydration/i.test(e))).toEqual([]);
  });

  test('reduced motion never requires Lenis for landing content', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const lenis = await page.evaluate(() =>
      document.documentElement.classList.contains('lenis'),
    );
    expect(lenis).toBe(false);
    await expect(page.locator('[data-hero-statement]').first()).toBeVisible();
  });

  test('optional smooth-scroll failure leaves native scrolling', async ({ page }) => {
    await page.route('**/lenis/**', (route) => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await expect(page.locator('[data-hero-statement]').first()).toBeVisible();
    await page.mouse.wheel(0, 400);
    await expect(page.locator('main')).toBeVisible();
  });
});
