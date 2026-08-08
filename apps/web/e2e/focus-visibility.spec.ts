import { expect, test } from '@playwright/test';

async function assertFocusVisibleOutline(
  page: import('@playwright/test').Page,
  locator: import('@playwright/test').Locator,
) {
  await locator.evaluate((el) => {
    el.focus({ focusVisible: true } as FocusOptions);
  });
  await expect(locator).toBeFocused();
  const style = await locator.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      boxShadow: computed.boxShadow,
    };
  });
  const hasOutline = style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0;
  const hasRing = style.boxShadow !== 'none' && /rgba?\(/.test(style.boxShadow);
  expect(hasOutline || hasRing).toBe(true);
  void page;
}

test.describe('WS12-T004 focus visibility', () => {
  test('marketing link and CTA show focus-visible styling', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await assertFocusVisibleOutline(page, skip);

    const cta = page.getByRole('link', { name: /get started|start|pricing|sign/i }).first();
    await cta.focus();
    await assertFocusVisibleOutline(page, cta);
  });

  test('auth inputs show focus styling', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    const email = page.getByLabel(/email/i);
    await email.focus();
    await assertFocusVisibleOutline(page, email);
  });

  test('dashboard preview navigation shows focus styling', async ({ page }) => {
    await page.goto('/dashboard/preview', { waitUntil: 'domcontentloaded' });
    const nav = page.getByRole('navigation', { name: /main|dashboard|mobile/i }).first();
    const link = nav.getByRole('link').first();
    await link.focus();
    await assertFocusVisibleOutline(page, link);
  });

  test('circle filter tabs show focus styling', async ({ page }) => {
    await page.goto('/dashboard/preview/circle', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('tab').first()).toBeVisible();

    let reachedTab = false;
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      reachedTab = await page.evaluate(
        () => document.activeElement?.getAttribute('role') === 'tab',
      );
      if (reachedTab) break;
    }
    expect(reachedTab).toBe(true);

    const style = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        outlineStyle: computed.outlineStyle,
        outlineWidth: computed.outlineWidth,
        boxShadow: computed.boxShadow,
      };
    });
    expect(style).not.toBeNull();
    const hasOutline =
      style!.outlineStyle !== 'none' && Number.parseFloat(style!.outlineWidth) > 0;
    const hasRing = style!.boxShadow !== 'none' && /rgba?\(/.test(style!.boxShadow);
    expect(hasOutline || hasRing).toBe(true);
  });

  test('settings branding switch exposes focus-visible utility classes', async ({ page }) => {
    await page.goto('/dashboard/preview/settings', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /theme, logo & accent/i }).click();
    const branding = page.getByRole('switch', { name: /remove codecard branding/i });
    await expect(branding).toHaveCount(1);
    const className = (await branding.getAttribute('class')) ?? '';
    expect(className).toMatch(/focus-visible:outline/);
  });

  test('demo profile actions remain focusable with visible focus', async ({ page }) => {
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    const action = page.getByRole('link').or(page.getByRole('button')).first();
    // Prefer a control inside main after skip.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    const mainLink = page.locator('main a, main button').first();
    await mainLink.focus();
    await assertFocusVisibleOutline(page, mainLink);
    void action;
  });
});
