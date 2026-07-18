import { expect, test } from '@playwright/test';

const WIDTHS = [375, 390, 414, 430] as const;

async function cssTargetSize(page: import('@playwright/test').Page, selector: string) {
  await page.waitForSelector(selector, { state: 'attached', timeout: 10000 });
  return page.locator(selector).first().evaluate((el) => {
    const style = window.getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return {
      height: Math.max(
        Number.parseFloat(style.minHeight) || 0,
        Number.parseFloat(style.height) || 0,
        box.height,
      ),
      width: Math.max(
        Number.parseFloat(style.minWidth) || 0,
        Number.parseFloat(style.width) || 0,
        box.width,
      ),
    };
  });
}

for (const width of WIDTHS) {
  test.describe(`WS12-T007 touch targets @ ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test('marketing menu trigger and CTA meet 44px', async ({ page }) => {
      await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
      const menu = await cssTargetSize(page, 'button[aria-label="Open menu"]');
      expect(menu.height).toBeGreaterThanOrEqual(43.5);
      expect(menu.width).toBeGreaterThanOrEqual(43.5);
      const cta = await cssTargetSize(page, '.cc-btn-pill-primary, .cc-btn-pill-demo');
      expect(cta.height).toBeGreaterThanOrEqual(43.5);
    });

    test('auth primary controls meet 44px', async ({ page }) => {
      await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
      const submit = page.getByRole('button', { name: /Sign in|Continue/i }).first();
      await expect(submit).toBeVisible();
      const box = await submit.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(43.5);
    });

    test('dashboard preview mobile nav and filter pills meet 44px', async ({
      page,
    }) => {
      await page.goto('/dashboard/preview', { waitUntil: 'domcontentloaded' });
      const nav = await cssTargetSize(page, '.cc-app-mobile-nav__link');
      expect(nav.height).toBeGreaterThanOrEqual(43.5);
      expect(nav.width).toBeGreaterThanOrEqual(43.5);

      await page.goto('/dashboard/preview/circle', { waitUntil: 'domcontentloaded' });
      // Wait for fade-in to settle so the filter bar stays attached.
      await page.waitForTimeout(700);
      const pill = await cssTargetSize(page, '.cc-app-filter-pill');
      expect(pill.height).toBeGreaterThanOrEqual(43.5);
      expect(pill.width).toBeGreaterThanOrEqual(43.5);
    });

    test('settings / topbar actions remain large enough', async ({ page }) => {
      await page.goto('/dashboard/preview/settings', { waitUntil: 'domcontentloaded' });
      const userMenu = await cssTargetSize(page, 'button[aria-label="User menu"]');
      expect(userMenu.height).toBeGreaterThanOrEqual(43.5);
      expect(userMenu.width).toBeGreaterThanOrEqual(43.5);
      const create = await cssTargetSize(page, '.cc-app-topbar-cta');
      expect(create.height).toBeGreaterThanOrEqual(43.5);
    });

    test('public report trigger meets 44px', async ({ page }) => {
      await page.setExtraHTTPHeaders({ 'x-codecard-e2e-fixture': 'public-report' });
      await page.goto('/e2e-fixtures/public-report', { waitUntil: 'domcontentloaded' });
      const report = await cssTargetSize(page, 'button[aria-label^="Report"]');
      expect(report.height).toBeGreaterThanOrEqual(43.5);
      expect(report.width).toBeGreaterThanOrEqual(43.5);
    });

    test('neighboring mobile nav links do not overlap', async ({ page }) => {
      await page.goto('/dashboard/preview', { waitUntil: 'domcontentloaded' });
      const links = page.locator('.cc-app-mobile-nav__link');
      const count = await links.count();
      if (count < 2) return;
      const a = await links.nth(0).boundingBox();
      const b = await links.nth(1).boundingBox();
      expect(a).not.toBeNull();
      expect(b).not.toBeNull();
      expect(a!.x + a!.width).toBeLessThanOrEqual(b!.x + 1);
    });
  });
}
