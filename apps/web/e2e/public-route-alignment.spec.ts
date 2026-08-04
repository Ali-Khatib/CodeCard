import { expect, test } from '@playwright/test';

test.describe('Phase 0A public route alignment', () => {
  test(' / renders the marketing landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByText(/CodeCard|professional|showcase|research/i).first()).toBeVisible();
    await expect(page.getByText('Alex Chen')).toHaveCount(0);
  });

  test('/demo renders the Alex Chen public-profile demo', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('/dashboard/preview remains the workspace preview', async ({ page }) => {
    await page.goto('/dashboard/preview', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard\/preview\/?$/);
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
    await expect(page.getByRole('navigation').or(page.locator('[data-testid*="sidebar"]')).first()).toBeVisible();
  });

  test('/landing permanently redirects to /', async ({ page }) => {
    const response = await page.goto('/landing', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('/demo/card permanently redirects to /demo', async ({ page }) => {
    const response = await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
  });

  test('refreshing / and /demo keeps the same destinations', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('main')).toBeVisible();

    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
  });

  test('browser back from demo to home works without a redirect loop', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('browser forward returns to demo after back', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
  });

  test('repeated / → /demo → / navigation stays stable', async ({ page }) => {
    for (let i = 0; i < 3; i += 1) {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText('Alex Chen')).toHaveCount(0);
      await page.goto('/demo', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Alex Chen').first()).toBeVisible();
    }
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });
});
