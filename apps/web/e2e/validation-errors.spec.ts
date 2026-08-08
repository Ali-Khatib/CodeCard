import { expect, test } from '@playwright/test';

test.describe('WS12-T003 public report validation', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({
      'x-codecard-e2e-fixture': 'public-report',
    });
  });

  test('associates empty-reason error with the select', async ({ page }) => {
    await page.goto('/e2e-fixtures/public-report');
    await page.getByRole('button', { name: 'Report this profile' }).click();
    await page.getByRole('button', { name: 'Submit report' }).click();

    const reason = page.getByLabel('Reason');
    await expect(reason).toBeFocused();
    await expect(reason).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await reason.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toContainText(/reason/i);
  });
});

test.describe('WS12-T003 account deletion validation', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({
      'x-codecard-e2e-fixture': 'settings-account',
    });
  });

  test('associates incorrect-password error with the password input', async ({ page }) => {
    await page.route('**/auth/v1/**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login' }),
      });
    });

    await page.goto('/e2e-fixtures/settings-account');
    await page.getByTestId('account-deletion-open').click();
    const dialog = page.getByTestId('account-deletion-dialog');
    await expect(dialog).toBeVisible();
    const password = dialog.getByTestId('account-deletion-password');
    await password.fill('not-the-password');
    await dialog.getByRole('button', { name: /Verify password/i }).click();
    await expect(password).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await password.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(dialog.locator(`#${describedBy}`)).toBeVisible();
  });
});
