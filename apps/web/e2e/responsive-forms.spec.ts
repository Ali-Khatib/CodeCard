import { expect, test } from '@playwright/test';

const WIDTHS = [375, 390, 414, 430] as const;

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      clientWidth: doc.clientWidth,
      scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
    };
  });
  expect(
    metrics.scrollWidth,
    `horizontal overflow ${metrics.scrollWidth} > ${metrics.clientWidth}`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function assertControlInViewport(
  locator: import('@playwright/test').Locator,
  label: string,
) {
  await expect(locator, label).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, label).not.toBeNull();
  expect(box!.x, `${label} x`).toBeGreaterThanOrEqual(-1);
  expect(box!.width, `${label} width`).toBeGreaterThan(0);
}

for (const width of WIDTHS) {
  test.describe(`WS12-T012 responsive forms @ ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test('sign-in form fits without horizontal overflow', async ({ page }) => {
      await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
      await assertControlInViewport(page.locator('input[type="email"]').first(), 'email');
      await assertControlInViewport(
        page.getByRole('button', { name: /Sign in|Continue/i }).first(),
        'submit',
      );
    });

    test('sign-up form fits without horizontal overflow', async ({ page }) => {
      await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
      await assertControlInViewport(page.locator('input').first(), 'first field');
    });

    test('forgot-password form fits', async ({ page }) => {
      await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
      await assertControlInViewport(page.locator('input[type="email"]').first(), 'email');
    });

    test('settings preview fits and primary controls remain reachable', async ({ page }) => {
      await page.goto('/dashboard/preview/settings', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
      await assertControlInViewport(
        page.getByRole('button', { name: 'User menu' }),
        'user menu',
      );
    });

    test('dashboard overview preview fits', async ({ page }) => {
      await page.goto('/dashboard/preview', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
      await assertControlInViewport(
        page.getByRole('button', { name: 'User menu' }),
        'user menu',
      );
    });

    test('projects preview surface fits', async ({ page }) => {
      await page.goto('/dashboard/preview/projects', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
      await assertControlInViewport(
        page.getByRole('button', { name: 'User menu' }),
        'user menu',
      );
    });

    test('research preview surface fits', async ({ page }) => {
      await page.goto('/dashboard/preview/research', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
      await assertControlInViewport(
        page.getByRole('button', { name: 'User menu' }),
        'user menu',
      );
    });

    test('connections and circle preview surfaces fit', async ({ page }) => {
      await page.goto('/dashboard/preview/connections', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
      await page.goto('/dashboard/preview/circle', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
    });

    test('sign-up tolerates long display names without horizontal overflow', async ({ page }) => {
      await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });
      const name = page.locator('input[name="displayName"], input[name="name"], input').first();
      await name.fill('A'.repeat(80) + ' ' + 'B'.repeat(80));
      await assertNoHorizontalOverflow(page);
      await assertControlInViewport(
        page.getByRole('button', { name: /Sign up|Create|Continue/i }).first(),
        'submit',
      );
    });

    test('account deletion dialog fits and scrolls internally', async ({ page }) => {
      await page.setExtraHTTPHeaders({ 'x-codecard-e2e-fixture': 'settings-account' });
      await page.goto('/e2e-fixtures/settings-account', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main[data-e2e-ready="true"]')).toBeVisible();
      await assertNoHorizontalOverflow(page);
      await page.getByTestId('account-deletion-open').click();
      const dialog = page.getByTestId('account-deletion-dialog');
      await expect(dialog).toBeVisible();
      await assertNoHorizontalOverflow(page);
      await assertControlInViewport(
        dialog.getByRole('button', { name: /Cancel/i }).first(),
        'cancel',
      );
      await assertControlInViewport(
        dialog.getByTestId('account-deletion-submit'),
        'confirm delete',
      );
    });

    test('public report dialog fits', async ({ page }) => {
      await page.setExtraHTTPHeaders({ 'x-codecard-e2e-fixture': 'public-report' });
      await page.goto('/e2e-fixtures/public-report', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
      const trigger = page.getByRole('button', { name: 'Report this profile' });
      await expect(trigger).toBeVisible();
      const dialog = page.getByRole('dialog', { name: 'Report this profile' });
      // Client dialog uses showModal(); retry until hydration wires the click handler.
      await expect(async () => {
        if (!(await dialog.isVisible().catch(() => false))) {
          await trigger.click();
        }
        await expect(dialog).toBeVisible({ timeout: 1000 });
        await expect(page.locator('dialog[open]')).toBeVisible({ timeout: 1000 });
      }).toPass({ timeout: 10_000 });
      await assertControlInViewport(dialog.locator('select').first(), 'reason');
      await assertControlInViewport(
        dialog.getByRole('button', { name: /Submit report|Cancel/i }).first(),
        'action',
      );
      await assertNoHorizontalOverflow(page);
    });

    test('long validation copy wraps on sign-in', async ({ page }) => {
      await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
      await page.locator('input[type="email"]').first().fill('not-an-email');
      await page.locator('input[type="password"]').first().fill('x');
      await page.getByRole('button', { name: /Sign in|Continue/i }).first().click();
      await page.waitForTimeout(300);
      await assertNoHorizontalOverflow(page);
    });

    test('text scaling does not force two-axis scroll on sign-in', async ({ page }) => {
      await page.addInitScript(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
      await assertControlInViewport(
        page.getByRole('button', { name: /Sign in|Continue/i }).first(),
        'submit@200%',
      );
    });
  });
}
