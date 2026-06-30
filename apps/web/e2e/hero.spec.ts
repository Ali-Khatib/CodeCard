import { test, expect } from '@playwright/test';

test.describe('Overview page', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="hero-section"]', { timeout: 30000 });
  });

  test('loads hero, research, and how-it-works on one page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Share what you build/i })).toBeVisible();
    await expect(page.locator('#research')).toBeAttached();
    await expect(page.locator('#how-it-works')).toBeAttached();
    await expect(page.getByRole('heading', { name: /Why order matters/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Tap → profile → project/i })).toBeVisible();
  });

  test('nav shows Overview, Profiles, and Pricing only', async ({ page }) => {
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Profiles' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Research' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'How it works' })).toHaveCount(0);
  });
});
