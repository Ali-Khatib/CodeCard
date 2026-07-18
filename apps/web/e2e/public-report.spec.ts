import { expect, test } from '@playwright/test';

test.describe('public report dialog', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({
      'x-codecard-e2e-fixture': 'public-report',
    });
  });

  test('is keyboard accessible and submits a page-derived target', async ({ page }) => {
    let submitted: Record<string, unknown> | null = null;
    await page.route('**/api/moderation/report', async (route) => {
      submitted = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, status: 'accepted' }),
      });
    });

    await page.goto('/e2e-fixtures/public-report');
    const trigger = page.getByRole('button', { name: 'Report this profile' });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Report this profile' });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel('Reason')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();

    await trigger.click();
    const reason = page.getByLabel('Reason');
    await expect(reason).toHaveJSProperty('validity.valueMissing', true);
    await reason.selectOption('spam');
    await page
      .getByLabel('Optional details')
      .fill('<script>alert("plain text only")</script>');
    await page.getByRole('button', { name: 'Submit report' }).click();

    await expect(
      page.getByText('Report submitted. CodeCard will review it.'),
    ).toBeVisible();
    expect(submitted).toEqual({
      target_type: 'profile',
      target_id: '11111111-1111-4111-8111-111111111111',
      reason_category: 'spam',
      description: '<script>alert("plain text only")</script>',
    });
    expect(page.url()).not.toContain('target_id');
  });

  test('remains usable at the configured viewport', async ({ page }) => {
    await page.goto('/e2e-fixtures/public-report');
    await page.getByRole('button', { name: 'Report this profile' }).click();
    const dialog = page.getByRole('dialog', { name: 'Report this profile' });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });

  test('does not expose real reporting from the Alex Chen demo', async ({ page }) => {
    let moderationRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/moderation/report')) moderationRequests += 1;
    });
    await page.goto('/demo/card');
    await expect(
      page.getByRole('button', { name: /Report this (profile|project)/ }),
    ).toHaveCount(0);
    expect(moderationRequests).toBe(0);
  });
});
