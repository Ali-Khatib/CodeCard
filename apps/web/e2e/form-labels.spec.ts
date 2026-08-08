import { expect, test } from '@playwright/test';

test.describe('WS12-T002 accessible form labels (browser)', () => {
  test('sign-in controls expose accessible names', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('sign-up controls expose accessible names', async ({ page }) => {
    await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('forgot-password email is labelled', async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('settings preview switch has an accessible name', async ({ page }) => {
    await page.goto('/dashboard/preview/settings', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /theme, logo & accent/i }).click();
    const branding = page.getByRole('switch', { name: /remove codecard branding/i });
    await expect(branding).toHaveCount(1);
  });
});

test.describe('WS12-T002 public report form labels', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({
      'x-codecard-e2e-fixture': 'public-report',
    });
  });

  test('report dialog fields are labelled', async ({ page }) => {
    await page.goto('/e2e-fixtures/public-report');
    const trigger = page.getByRole('button', { name: 'Report this profile' });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Report this profile' });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel('Reason')).toBeVisible();
    await expect(page.getByLabel('Optional details')).toBeVisible();
  });
});
