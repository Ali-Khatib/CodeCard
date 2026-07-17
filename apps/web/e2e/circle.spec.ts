import { expect, test, type Page } from '@playwright/test';

const FIXTURE_PATH = '/e2e-fixtures/circle';

async function openFixture(page: Page) {
  await page.setExtraHTTPHeaders({
    'x-codecard-e2e-fixture': 'circle',
  });
  await page.goto(FIXTURE_PATH, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Circle feed fixture' })).toBeVisible();
  await expect(page.locator('main[data-e2e-ready="true"]')).toBeVisible();
  await page.setExtraHTTPHeaders({});
}

test.describe('WS16 Circle feed (mocked browser)', () => {
  test('no-connection empty state never shows demo people', async ({ page }) => {
    await openFixture(page);
    await expect(
      page.getByRole('heading', { name: 'Your Circle starts with your Connections' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Find people to add' })).toBeVisible();
    await expect(page.getByText('Jordan Lee')).toHaveCount(0);
    await expect(page.getByText('Alex Chen')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Like' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Comment' })).toHaveCount(0);
  });

  test('connections with no activity shows truthful empty state', async ({ page }) => {
    await openFixture(page);
    await page.getByRole('button', { name: 'No activity state' }).click();
    await expect(page.getByRole('heading', { name: 'Nothing new yet' })).toBeVisible();
    await expect(page.getByText('Jordan Lee')).toHaveCount(0);
  });

  test('populated feed shows project and research activity with real links', async ({ page }) => {
    await openFixture(page);
    await page.getByRole('button', { name: 'Populated feed' }).click();
    await expect(page.getByText('Bob Smith published a research paper')).toBeVisible();
    await expect(page.getByText('Bob Smith published a new project')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Graph Limits', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'PipelineX', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Read paper: Graph Limits' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View project: PipelineX' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Like' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'React' })).toHaveCount(0);
  });

  test('mobile layout has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFixture(page);
    await page.getByRole('button', { name: 'Populated feed' }).click();

    const hasOverflow = async () =>
      page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );

    expect(await hasOverflow()).toBe(false);
    await page.setViewportSize({ width: 375, height: 812 });
    expect(await hasOverflow()).toBe(false);
    await page.setViewportSize({ width: 430, height: 932 });
    expect(await hasOverflow()).toBe(false);
  });
});
