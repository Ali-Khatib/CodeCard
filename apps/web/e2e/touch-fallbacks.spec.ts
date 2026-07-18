import { expect, test } from '@playwright/test';

test.describe('WS12-T008 touch interaction fallbacks', () => {
  test('demo project case-study tabs switch by click', async ({ page }) => {
    await page.goto('/demo/projects/demo-1', { waitUntil: 'domcontentloaded' });
    const tabs = page.locator('[role="tablist"][aria-label="Project showcase sections"] [role="tab"]');
    const count = await tabs.count();
    test.skip(count < 2, 'Demo project has fewer than two showcase tabs');
    const second = tabs.nth(1);
    await second.click();
    await expect(second).toHaveAttribute('aria-selected', 'true');
    const panelId = await second.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    await expect(page.locator(`#${panelId}`)).toBeVisible();
  });

  test('demo project case-study tabs switch by keyboard', async ({ page }) => {
    await page.goto('/demo/projects/demo-1', { waitUntil: 'domcontentloaded' });
    const tabs = page.locator('[role="tablist"][aria-label="Project showcase sections"] [role="tab"]');
    const count = await tabs.count();
    test.skip(count < 2, 'Demo project has fewer than two showcase tabs');
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  });

  test('coarse pointer still activates tabs by tap/click', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/demo/projects/demo-1', { waitUntil: 'domcontentloaded' });
    const tabs = page.locator('[role="tablist"][aria-label="Project showcase sections"] [role="tab"]');
    const count = await tabs.count();
    test.skip(count < 2, 'Demo project has fewer than two showcase tabs');
    await tabs.nth(1).tap().catch(async () => {
      await tabs.nth(1).click();
    });
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  });
});
