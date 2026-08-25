import { test, expect } from '@playwright/test';

/**
 * Landing page structure smoke.
 *
 * Rewritten for the editorial landing. The previous version asserted a "Share
 * what you build" headline plus `#research` / `#how-it-works` anchors, none of
 * which survive the current information architecture — `#research` now belongs
 * to public profile pages and the walkthrough replaced `#how-it-works`.
 */

test.describe('Landing page', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="hero-section"]', { timeout: 30000 });
  });

  test('hero headline, research proof, and closing CTA all render', async ({ page }) => {
    const headline = page.getByRole('heading', { level: 1 });
    await expect(headline).toBeVisible();
    /* Accessible name spans the visible lead plus the sr-only second line. */
    await expect(headline).toContainText(/YOUR WORK\./);
    await expect(headline).toContainText(/ONE IDENTITY\./);

    await expect(page.getByTestId('editorial-research-proof')).toBeAttached();
    await expect(page.locator('#build-yours')).toBeAttached();
  });

  test('hero CTAs point at sign-up and the demo', async ({ page }) => {
    await expect(page.getByTestId('hero-primary-cta')).toHaveAttribute('href', '/sign-up');
    await expect(
      page.getByRole('link', { name: /Open Live Demo/i }).first(),
    ).toHaveAttribute('href', /\/demo\/?$/);
  });

  test('marketing nav exposes Pricing and no stale sections', async ({ page }) => {
    const nav = page.getByRole('navigation').first();
    await expect(nav.getByRole('link', { name: 'Pricing' })).toBeVisible();
    /* Sections that were retired from the nav must not come back silently. */
    await expect(nav.getByRole('link', { name: 'Research' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'How it works' })).toHaveCount(0);
  });
});
