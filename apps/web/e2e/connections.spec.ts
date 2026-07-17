import { expect, test, type Page } from '@playwright/test';

const FIXTURE_PATH = '/e2e-fixtures/connections';

async function openFixture(page: Page) {
  await page.setExtraHTTPHeaders({
    'x-codecard-e2e-fixture': 'connections',
  });
  await page.goto(FIXTURE_PATH, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Connections save flow fixture' })).toBeVisible();
  await expect(page.locator('main[data-e2e-ready="true"]')).toBeVisible();
  await page.setExtraHTTPHeaders({});
}

test.describe('WS15-T004 Connections save flow (mocked browser)', () => {
  test('add from public profile, see dashboard card, remove to empty state', async ({ page }) => {
    await openFixture(page);

    await page.getByRole('button', { name: 'Add Bob Smith as a Connection' }).click();
    await expect(page.locator('main')).toHaveAttribute('data-e2e-connected', 'true');
    await expect(page.getByRole('status')).toContainText('Added Bob Smith to your Connections.');

    await page.getByRole('button', { name: 'Connections dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Your Connections' })).toBeVisible();
    await expect(page.getByText('Bob Smith').first()).toBeVisible();
    await expect(page.getByText('Jordan Lee')).toHaveCount(0);
    await expect(page.getByText('Alex Chen')).toHaveCount(0);

    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('.cc-connection-blob__trigger').first().click();
    await page.getByRole('button', { name: 'Remove Bob Smith from Connections' }).click();

    await expect(page.getByRole('heading', { name: 'Build a network you can actually remember' })).toBeVisible();
    await expect(page.locator('main')).toHaveAttribute('data-e2e-count', '0');
  });

  test('empty authenticated state never shows demo people', async ({ page }) => {
    await openFixture(page);
    await page.getByRole('button', { name: 'Connections dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Build a network you can actually remember' })).toBeVisible();
    await expect(page.getByText('Jordan Lee')).toHaveCount(0);
    await expect(page.getByText('Alex Chen')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Explore CodeCards' })).toBeVisible();
  });

  test('mobile layout has no horizontal overflow for empty and populated states', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openFixture(page);

    const hasOverflow = async () =>
      page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

    await page.getByRole('button', { name: 'Connections dashboard' }).click();
    expect(await hasOverflow()).toBe(false);

    await page.getByRole('button', { name: 'Public profile' }).click();
    await page.getByRole('button', { name: 'Add Bob Smith as a Connection' }).click();
    await page.getByRole('button', { name: 'Connections dashboard' }).click();
    await expect(page.getByText('Bob Smith')).toBeVisible();
    expect(await hasOverflow()).toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    expect(await hasOverflow()).toBe(false);

    await page.setViewportSize({ width: 430, height: 932 });
    expect(await hasOverflow()).toBe(false);
  });
});
