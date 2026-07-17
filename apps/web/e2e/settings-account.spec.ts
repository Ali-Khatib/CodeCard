import { expect, test, type Page, type Route } from '@playwright/test';

const FIXTURE_PATH = '/e2e-fixtures/settings-account';

async function openFixture(page: Page) {
  await page.setExtraHTTPHeaders({
    'x-codecard-e2e-fixture': 'settings-account',
  });
  await page.goto(FIXTURE_PATH, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Settings account controls fixture' })).toBeVisible();
  await expect(page.locator('main[data-e2e-ready="true"]')).toBeVisible();
  await page.setExtraHTTPHeaders({});
}

test.describe('WS09-T008 Settings account controls (mocked browser)', () => {
  test('export downloads JSON and shows success without changing the account', async ({
    page,
  }) => {
    let exportCalls = 0;
    await page.route('**/api/account/export', async (route: Route) => {
      exportCalls += 1;
      expect(route.request().method()).toBe('POST');
      const body = route.request().postDataJSON() as Record<string, unknown>;
      expect(body).toEqual({ format: 'json' });
      expect(body).not.toHaveProperty('userId');
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        headers: {
          'Content-Disposition': 'attachment; filename="codecard-account-export-2026-07-17.json"',
        },
        body: JSON.stringify({
          schema_version: '1.0',
          account: { user_id: '00000000-0000-4000-8000-000000000099', email: 'e2e@example.com' },
        }),
      });
    });

    const downloadPromise = page.waitForEvent('download');
    await openFixture(page);
    await page.getByRole('button', { name: /Download account data as JSON/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('codecard-account-export-2026-07-17.json');
    await expect(page.getByTestId('mutation-toast-success')).toContainText('Account export ready');
    expect(exportCalls).toBe(1);
  });

  test('deletion requires exact DELETE, rejects lowercase, then succeeds once', async ({
    page,
  }) => {
    let deleteCalls = 0;
    await page.route('**/api/account/delete', async (route: Route) => {
      deleteCalls += 1;
      const body = route.request().postDataJSON() as {
        confirmation?: string;
        reauthentication?: { method?: string };
        userId?: string;
      };
      expect(body.confirmation).toBe('DELETE');
      expect(body.reauthentication?.method).toBe('recent_login');
      expect(body).not.toHaveProperty('userId');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route('**/auth/v1/**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'e2e',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'e2e',
          user: { id: '00000000-0000-4000-8000-000000000099', email: 'e2e@example.com' },
        }),
      });
    });

    await openFixture(page);
    await page.getByTestId('account-deletion-open').click();
    const dialog = page.getByTestId('account-deletion-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/permanently removes/i);
    expect(deleteCalls).toBe(0);

    await dialog.getByTestId('account-deletion-confirmation').fill('delete');
    await expect(dialog.getByTestId('account-deletion-submit')).toBeDisabled();

    await dialog.getByTestId('account-deletion-confirmation').fill('DELETE');
    await dialog.getByTestId('account-deletion-password').fill('CorrectHorseBattery');
    await dialog.getByRole('button', { name: /Verify password/i }).click();
    await expect(dialog.getByText(/Password verified/i)).toBeVisible();

    // Intercept hard navigation after success.
    await page.route('**/sign-in**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body><h1>Sign in</h1><p>Your CodeCard account has been deleted.</p></body></html>',
      });
    });

    await dialog.getByTestId('account-deletion-submit').click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    expect(deleteCalls).toBe(1);
  });

  test('ACCOUNT_DELETION_NOT_READY keeps the account UI intact', async ({ page }) => {
    await page.route('**/api/account/delete', async (route: Route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Account deletion is not available yet.',
          code: 'ACCOUNT_DELETION_NOT_READY',
        }),
      });
    });

    await page.route('**/auth/v1/**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'e2e',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'e2e',
          user: { id: '00000000-0000-4000-8000-000000000099', email: 'e2e@example.com' },
        }),
      });
    });

    await openFixture(page);
    await page.getByTestId('account-deletion-open').click();
    const dialog = page.getByTestId('account-deletion-dialog');
    await dialog.getByTestId('account-deletion-confirmation').fill('DELETE');
    await dialog.getByTestId('account-deletion-password').fill('CorrectHorseBattery');
    await dialog.getByRole('button', { name: /Verify password/i }).click();
    await expect(dialog.getByText(/Password verified/i)).toBeVisible();
    await dialog.getByTestId('account-deletion-submit').click();
    await expect(dialog.getByRole('alert')).toContainText(/has not been deleted or changed/i);
    await expect(page).toHaveURL(/e2e-fixtures\/settings-account/);
    await expect(dialog).toBeVisible();
  });
});
