import { expect, test } from '@playwright/test';

async function assertSkipLink(page: import('@playwright/test').Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });

  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toHaveCount(1);
  await expect(skip).toHaveAttribute('href', '#main-content');

  // Parked off-screen until focused — still in the accessibility tree.
  const beforeLeft = await skip.evaluate((el) => window.getComputedStyle(el).left);
  expect(beforeLeft).toBe('-10000px');

  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();

  const focusedStyle = await skip.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return { left: style.left, top: style.top };
  });
  expect(focusedStyle.left).toBe('16px');
  expect(focusedStyle.top).toBe('16px');

  const focused = await skip.boundingBox();
  expect(focused).not.toBeNull();
  expect(focused!.x).toBeGreaterThanOrEqual(0);
  expect(focused!.y).toBeGreaterThanOrEqual(0);
  expect(focused!.height).toBeGreaterThanOrEqual(40);

  // Activate via click while focused — more stable than Enter across client auth shells.
  await skip.click();
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator('main#main-content')).toBeFocused();
  await expect(page.locator('main#main-content')).toHaveCount(1);
  await expect(page.locator('#main-content')).toHaveCount(1);
}

test.describe('WS12-T001 skip-to-content', () => {
  test('marketing shell: first focus and main target', async ({ page }) => {
    await assertSkipLink(page, '/pricing');
  });

  test('auth shell: first focus and main target', async ({ page }) => {
    await assertSkipLink(page, '/sign-in');
  });

  test('demo profile shell remains isolated with one main target', async ({ page }) => {
    await assertSkipLink(page, '/demo/card');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('public not-found shell: first focus and main target', async ({ page }) => {
    await assertSkipLink(page, '/zz-missing-public-profile-ws12');
  });

  test('dashboard preview shell: first focus and main target', async ({ page }) => {
    await assertSkipLink(page, '/dashboard/preview');
  });

  test('legal shell: first focus and main target', async ({ page }) => {
    await assertSkipLink(page, '/legal/privacy');
  });

  test('skip link does not shift layout for mouse users', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    const before = await page.locator('main#main-content').boundingBox();
    await page.mouse.move(10, 10);
    await page.mouse.click(10, 10);
    const after = await page.locator('main#main-content').boundingBox();
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(Math.abs(before!.y - after!.y)).toBeLessThan(2);
  });
});
