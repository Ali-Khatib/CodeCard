import { test, expect, type Page } from '@playwright/test';

const DEMO_RESEARCH = '/demo/card/research/retrieval-evaluation-for-dev-tools';
/*
 * Opening the reader must not navigate. Derived from the path above so the two
 * cannot drift again — the inline assertions previously still expected the
 * pre-`/demo/card` route and failed on every mobile width.
 */
const DEMO_RESEARCH_URL = new RegExp(`${DEMO_RESEARCH}$`);

async function assertNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const dialog = document.querySelector('[data-research-pdf-dialog="true"]') as HTMLElement | null;
    const target = dialog ?? document.documentElement;
    return {
      scrollWidth: target.scrollWidth,
      clientWidth: target.clientWidth,
    };
  });
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2);
}

async function openReader(page: Page) {
  const readBtn = page.getByRole('button', { name: /read paper/i });
  await expect(readBtn).toBeVisible();
  const reader = page.locator('[data-research-pdf-reader="true"]');

  /*
   * Dispatched through the DOM rather than Playwright's click(): the control
   * sits in a sticky header, and scroll-into-view would reset the page scroll
   * the restore assertions depend on.
   *
   * Retried because the specs navigate with `domcontentloaded`, which can fire
   * before React attaches its handler — the first click is then swallowed with
   * no error and the reader never opens. Guarded on count so a retry cannot
   * toggle an already-open reader shut.
   */
  await expect(async () => {
    if ((await reader.count()) === 0) {
      await readBtn.evaluate((el) => (el as HTMLButtonElement).click());
    }
    await expect(reader).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20000 });
}

test.describe('inline research PDF reader', () => {
  for (const width of [375, 390, 430] as const) {
    test(`mobile ${width}px: Read paper opens fullscreen reader and restores scroll`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(DEMO_RESEARCH, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      await page.evaluate(() => window.scrollTo(0, 420));
      const beforeScroll = await page.evaluate(() => window.scrollY);
      expect(beforeScroll).toBeGreaterThan(100);

      await openReader(page);

      await expect(page).toHaveURL(DEMO_RESEARCH_URL);
      const reader = page.locator('[data-research-pdf-reader="true"]');
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(reader.getByText(/loading paper/i)).toBeVisible();

      await expect(page.locator('[data-pdf-status="ready"]')).toBeVisible({ timeout: 20000 });
      await expect(page.locator('canvas[aria-label^="Page"]')).toHaveCount(1, { timeout: 20000 });
      await expect(page.getByRole('link', { name: /open original/i })).toBeVisible();

      const dialogBox = page.locator('[data-research-pdf-dialog="true"]');
      const box = await dialogBox.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThanOrEqual(width - 2);
      expect(box!.height).toBeGreaterThan(700);

      await assertNoHorizontalOverflow(page);

      const bodyLocked = await page.evaluate(() => document.body.style.position === 'fixed');
      expect(bodyLocked).toBe(true);

      await page.getByRole('button', { name: /close paper reader/i }).first().click();
      await expect(page.locator('[data-research-pdf-reader="true"]')).toHaveCount(0);
      await expect(page).toHaveURL(DEMO_RESEARCH_URL);

      await page.waitForFunction(
        (expectedY) => Math.abs(window.scrollY - expectedY) <= 8,
        beforeScroll,
        { timeout: 3000 },
      );
      const afterScroll = await page.evaluate(() => window.scrollY);
      expect(Math.abs(afterScroll - beforeScroll)).toBeLessThanOrEqual(8);
    });
  }

  test('failure state shows fallback with original, retry, and close', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/public/research/**/pdf*', async (route) => {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        headers: { 'cache-control': 'no-store' },
        body: JSON.stringify({ error: 'PDF unavailable' }),
      });
    });

    await page.goto(DEMO_RESEARCH, { waitUntil: 'domcontentloaded' });
    await openReader(page);
    const reader = page.locator('[data-research-pdf-reader="true"]');
    await expect(reader.getByText(/preview unavailable/i)).toBeVisible({ timeout: 15000 });
    await expect(reader.getByRole('link', { name: /open original/i }).first()).toBeVisible();
    await expect(reader.getByRole('button', { name: /try again/i })).toBeVisible();
    await expect(reader.getByRole('button', { name: /^close$/i })).toBeVisible();
  });

  test('desktop: dialog opens and Escape closes with focus restore', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(DEMO_RESEARCH, { waitUntil: 'domcontentloaded' });

    const readBtn = page.getByRole('button', { name: /read paper/i });
    await openReader(page);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('[data-pdf-status="ready"]')).toBeVisible({ timeout: 20000 });

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-research-pdf-reader="true"]')).toHaveCount(0);
    await expect(readBtn).toBeFocused();
  });
});
