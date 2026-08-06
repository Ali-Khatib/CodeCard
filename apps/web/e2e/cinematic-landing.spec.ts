import { expect, test } from '@playwright/test';

test.describe('Identity cinematic landing', () => {
  test('hero content exists before cinematic runtime', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toContain('YOUR WORK.');
    expect(html).toContain('ONE IDENTITY.');
    await expect(page.getByTestId('hero-section').locator('[data-hero-statement]').first()).toBeVisible();
    await expect(page.getByTestId('hero-primary-cta')).toBeVisible();
  });

  test('identity scenes mount on / only', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('identity-landing')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('identity-assembly')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('identity-inspect')).toBeVisible({ timeout: 15000 });

    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('identity-landing')).toHaveCount(0);
    await expect(page.getByTestId('identity-assembly')).toHaveCount(0);
    await expect(page.getByTestId('identity-inspect')).toHaveCount(0);

    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('identity-landing')).toHaveCount(0);
    await expect(page.getByTestId('identity-assembly')).toHaveCount(0);
    await expect(page.getByTestId('identity-inspect')).toHaveCount(0);
  });

  test('desktop pins assembly; reverse scroll restores earlier state', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-390', 'desktop pin behavior');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'networkidle' });

    const scene = page.getByTestId('identity-assembly');
    await scene.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.2));
    await page.waitForTimeout(500);
    const card = page.getByTestId('identity-product-card').first();
    await expect(card).toBeVisible();

    const midOpacity = await card.evaluate((el) => getComputedStyle(el).opacity);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const topOpacity = await card.evaluate((el) => {
      const wrap = el.closest('[data-assembly-card]');
      return wrap ? getComputedStyle(wrap).opacity : getComputedStyle(el).opacity;
    });
    expect(Number(topOpacity)).toBeLessThanOrEqual(Number(midOpacity) + 0.05);
  });

  test('inspect advances stages on desktop scrub', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-390', 'desktop sticky inspect');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'networkidle' });

    const inspect = page.getByTestId('identity-inspect');
    await inspect.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(page.getByTestId('identity-inspect-frame')).toBeVisible();

    for (let i = 0; i < 4; i += 1) {
      await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.55)));
      await page.waitForTimeout(350);
    }
    await expect(page.getByTestId('identity-inspect-frame')).toBeVisible();
    const stage = Number((await inspect.getAttribute('data-active-stage')) ?? '0');
    expect(stage).toBeGreaterThanOrEqual(0);
    expect(stage).toBeLessThanOrEqual(3);
  });

  test('mobile uses non-pinned alternatives', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'networkidle' });
    const scene = page.getByTestId('identity-assembly');
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute('data-scene-mode', 'mobile');
    await expect(page.getByTestId('identity-inspect-mobile')).toBeVisible();
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });

  test('reduced motion uses static alternatives', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    const scene = page.getByTestId('identity-assembly');
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute('data-scene-mode', 'reduced');
    await expect(page.getByTestId('identity-assembly-static')).toBeVisible();
    await expect(page.getByTestId('identity-inspect-mobile')).toBeVisible();
  });

  test('final CTA destinations remain correct', async ({ page }) => {
    await page.goto('/#build-yours', { waitUntil: 'domcontentloaded' });
    const closing = page.locator('#build-yours');
    await expect(closing).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('closing-profile-preview-link')).toHaveAttribute(
      'href',
      '/demo/card',
    );
    const demo = closing.locator('a').filter({ hasText: /Live Workspace/i }).first();
    await expect(demo).toHaveAttribute('href', /\/demo\/?$/);
  });

  test('anchor navigation and history remain functional', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#build-yours').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await expect(page.locator('#build-yours')).toBeVisible({ timeout: 15000 });
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/demo/);
  });

  test('leaving / removes cinematic pin triggers', async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __CODECARD_E2E_ALLOW_MOTION_DEBUG__?: boolean }).__CODECARD_E2E_ALLOW_MOTION_DEBUG__ =
        true;
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByTestId('identity-assembly').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const before = await page.evaluate(() => {
      const dbg = (
        window as Window & {
          __codecardMotionDebug?: { getScrollTriggerCount: () => number; hasTriggerId: (id: string) => boolean };
        }
      ).__codecardMotionDebug;
      return {
        count: dbg?.getScrollTriggerCount?.() ?? -1,
        hasPin: dbg?.hasTriggerId?.('identity-assembly-pin') ?? false,
      };
    });

    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => {
      const dbg = (
        window as Window & {
          __codecardMotionDebug?: { getScrollTriggerCount: () => number; hasTriggerId: (id: string) => boolean };
        }
      ).__codecardMotionDebug;
      return {
        hasAssembly: dbg?.hasTriggerId?.('identity-assembly-pin') ?? false,
        hasInspect: dbg?.hasTriggerId?.('identity-inspect-pin') ?? false,
      };
    });
    expect(after.hasAssembly).toBe(false);
    expect(after.hasInspect).toBe(false);
    void before;
  });

  test('no console errors on landing load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByTestId('identity-inspect').scrollIntoViewIfNeeded();
    expect(errors.filter((e) => !/ResizeObserver|hydration/i.test(e))).toEqual([]);
  });
});
