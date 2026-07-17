import { expect, test, type Page } from '@playwright/test';

const FIXTURE_PATH = '/e2e-fixtures/xss-public';

async function openFixture(page: Page) {
  await page.setExtraHTTPHeaders({
    'x-codecard-e2e-fixture': 'xss-public',
  });
  await page.goto(FIXTURE_PATH, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'XSS public render fixture' })).toBeVisible();
  await expect(page.locator('main[data-e2e-ready="true"]')).toBeVisible();
  await page.setExtraHTTPHeaders({});
}

test.describe('WS11-T006 XSS public rendering (mocked browser)', () => {
  test('renders XSS payloads as inert text without script execution', async ({ page }) => {
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    await openFixture(page);

    await expect(page.getByTestId('xss-sample').first()).toBeVisible();
    await expect(page.getByText('<script>alert(1)</script>', { exact: true })).toBeVisible();
    await expect(page.getByTestId('xss-rejected-link').first()).toBeVisible();

    const scriptNodes = await page.locator('main script').count();
    expect(scriptNodes).toBe(0);

    const unsafeAnchors = await page.locator('a[href^="javascript:"]').count();
    expect(unsafeAnchors).toBe(0);

    // Give hydration a beat; no alert dialogs should fire.
    await page.waitForTimeout(300);
    expect(dialogs).toEqual([]);
  });

  test('mobile viewport keeps payloads readable without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFixture(page);
    await expect(page.getByTestId('xss-text').first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
