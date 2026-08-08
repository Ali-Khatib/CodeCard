import { expect, test } from '@playwright/test';

test.describe('WS12-T010 accessible dialogs', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({
      'x-codecard-e2e-fixture': 'settings-account',
    });
  });

  test('account deletion dialog traps focus and restores the trigger', async ({ page }) => {
    await page.goto('/e2e-fixtures/settings-account');
    const trigger = page.getByTestId('account-deletion-open');
    await trigger.click();
    const dialog = page.getByTestId('account-deletion-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('role', 'dialog');

    const confirm = dialog.getByTestId('account-deletion-confirmation');
    await expect(confirm).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe('WS12-T010 public report dialog', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({
      'x-codecard-e2e-fixture': 'public-report',
    });
  });

  test('report dialog restores trigger focus on Escape', async ({ page }) => {
    await page.goto('/e2e-fixtures/public-report');
    const trigger = page.getByRole('button', { name: 'Report this profile' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Report this profile' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
