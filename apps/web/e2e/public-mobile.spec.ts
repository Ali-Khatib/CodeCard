import { test, expect, type Page } from '@playwright/test';

const VIEWPORTS = [
  { width: 375, height: 812, name: '375' },
  { width: 390, height: 844, name: '390' },
  { width: 412, height: 915, name: '412' },
  { width: 430, height: 932, name: '430' },
] as const;

async function assertNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const widest = Math.max(
      doc.scrollWidth,
      body?.scrollWidth ?? 0,
      ...Array.from(document.querySelectorAll('main, h1, a, button, img, figure')).map(
        (el) => (el as HTMLElement).getBoundingClientRect().right,
      ),
    );
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      widestRight: widest,
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.widestRight).toBeLessThanOrEqual(metrics.clientWidth + 2);
}

test.describe('WS06-T007 public mobile QA', () => {
  for (const viewport of VIEWPORTS) {
    test(`not-found fits ${viewport.name}px without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/zz-missing-public-profile-ws06', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /back to codecard/i })).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }

  test('desktop not-found remains usable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/zz-missing-public-profile-ws06', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
