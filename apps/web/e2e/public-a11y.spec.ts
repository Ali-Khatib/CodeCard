import { test, expect } from '@playwright/test';

test.describe('WS06-T008 public accessibility', () => {
  test('not-found supports keyboard navigation to recovery actions', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/zz-missing-public-profile-ws06', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1, name: /page not found/i })).toBeVisible();

    await page.keyboard.press('Tab');
    const first = page.locator(':focus');
    await expect(first).toBeVisible();

    const back = page.getByRole('link', { name: /back to codecard/i });
    await back.focus();
    await expect(back).toBeFocused();
    await expect(back).toHaveAttribute('href', '/');
  });

  test('not-found remains usable at 200% zoom scale', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/zz-missing-public-profile-ws06', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      document.documentElement.style.zoom = '200%';
    });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to codecard/i })).toBeVisible();
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth <= doc.clientWidth + 2;
    });
    expect(overflow).toBe(true);
  });
});
