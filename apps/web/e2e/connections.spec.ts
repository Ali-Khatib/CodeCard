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

test.describe('WS15 Connections management (mocked browser)', () => {
  test('empty authenticated state never shows demo people', async ({ page }) => {
    await openFixture(page);
    await page.getByRole('button', { name: 'Connections dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Build a network you can actually remember' })).toBeVisible();
    await expect(page.getByText('Jordan Lee')).toHaveCount(0);
    await expect(page.getByText('Alex Chen')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Explore CodeCards' })).toBeVisible();
  });

  test('full management: add, collect, note, search, remove collection membership, remove connection', async ({
    page,
  }) => {
    await openFixture(page);

    await page.getByRole('button', { name: 'Add Bob Smith as a Connection' }).click();
    await expect(page.locator('main')).toHaveAttribute('data-e2e-connected', 'true');

    await page.getByRole('button', { name: 'Connections dashboard' }).click();
    await expect(page.getByText('Bob Smith').first()).toBeVisible();

    await page.getByRole('button', { name: 'Create Recruiters collection' }).click();
    await expect(page.locator('main')).toHaveAttribute('data-e2e-collections', '1');

    await page.locator('.cc-connection-blob__trigger').first().click();
    const assign = page.getByLabel('Add Bob Smith to Recruiters');
    await expect(assign).toBeVisible();
    await assign.click({ force: true });
    await expect(page.getByLabel('Remove Bob Smith from Recruiters')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Recruiters · 1 Connection')).toBeVisible();

    await page.getByRole('button', { name: 'Edit private note for Bob Smith' }).click();
    await page.getByRole('textbox', { name: 'Private note' }).fill('Met at DevConf — follow up on AI paper');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('main')).toHaveAttribute('data-e2e-note', 'true');

    await page.getByLabel('Search connections').fill('DevConf');
    await expect(page.getByText('Bob Smith').first()).toBeVisible();

    await page.getByLabel('Filter by collection').selectOption('e2e-col-recruiters');
    await expect(page.getByText('Bob Smith').first()).toBeVisible();

    // Clear search/filter before unassign so the card is not remounted mid-click.
    await page.getByLabel('Search connections').fill('');
    await page.getByLabel('Filter by collection').selectOption('all');
    await expect(page.locator('main')).toHaveAttribute('data-e2e-memberships', '1');

    const trigger = page.locator('.cc-connection-blob__trigger').first();
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
      await trigger.click();
    }
    const removeMembership = page.getByLabel('Remove Bob Smith from Recruiters');
    await expect(removeMembership).toBeVisible();
    await removeMembership.click({ force: true });
    await expect(page.locator('main')).toHaveAttribute('data-e2e-memberships', '0');
    await expect(page.getByText('Recruiters · 0 Connections')).toBeVisible();
    await expect(page.getByText('Bob Smith').first()).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
      await trigger.click();
    }
    await page.getByRole('button', { name: 'Remove Bob Smith from Connections' }).click();
    await expect(page.getByRole('heading', { name: 'Build a network you can actually remember' })).toBeVisible();
    await expect(page.locator('main')).toHaveAttribute('data-e2e-count', '0');
  });

  test('mobile layout has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFixture(page);

    const hasOverflow = async () =>
      page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );

    await page.getByRole('button', { name: 'Add Bob Smith as a Connection' }).click();
    await page.getByRole('button', { name: 'Connections dashboard' }).click();
    await page.getByRole('button', { name: 'Create Recruiters collection' }).click();
    expect(await hasOverflow()).toBe(false);

    await page.setViewportSize({ width: 375, height: 812 });
    expect(await hasOverflow()).toBe(false);
    await page.setViewportSize({ width: 430, height: 932 });
    expect(await hasOverflow()).toBe(false);
  });

  test('target privacy panel never exposes owner note or save relationship', async ({ page }) => {
    await openFixture(page);
    await page.getByRole('button', { name: 'Add Bob Smith as a Connection' }).click();
    await page.getByRole('button', { name: 'Connections dashboard' }).click();
    await page.getByRole('button', { name: 'Create Recruiters collection' }).click();
    const trigger = page.locator('.cc-connection-blob__trigger').first();
    await trigger.click();
    await page.getByLabel('Add Bob Smith to Recruiters').click({ force: true });
    await page.getByRole('button', { name: 'Edit private note for Bob Smith' }).click();
    await page.getByRole('textbox', { name: 'Private note' }).fill('Secret owner-only note');
    await page.getByRole('button', { name: 'Save' }).click();

    const privacy = page.locator('[data-e2e-privacy-panel="true"]');
    await expect(privacy).toBeVisible();
    await expect(privacy.getByText('Who saved me: not visible')).toBeVisible();
    await expect(privacy.getByText('Private notes about me: not visible')).toBeVisible();
    await expect(privacy.getByText('Collections I am in: not visible')).toBeVisible();
    await expect(privacy.getByText('Secret owner-only note')).toHaveCount(0);
    await expect(page.locator('[data-e2e-owner-note-exists="true"]')).toHaveCount(1);
  });
});
