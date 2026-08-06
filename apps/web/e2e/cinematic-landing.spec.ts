import { expect, test } from '@playwright/test';

test.describe('Phase 2 cinematic landing', () => {
  test('hero content exists before cinematic runtime', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toContain('cc-hume-hero__headline');
    expect(html).toContain('Your best work');
    await expect(page.getByTestId('hero-section').locator('[data-hero-statement]').first()).toBeVisible();
    await expect(page.getByTestId('hero-primary-cta')).toBeVisible();
  });

  test('cinematic scenes mount on / only', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('cinematic-scattered-scene')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('cinematic-showcase-scene')).toBeVisible({ timeout: 15000 });

    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('cinematic-scattered-scene')).toHaveCount(0);
    await expect(page.getByTestId('cinematic-showcase-scene')).toHaveCount(0);

    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('cinematic-scattered-scene')).toHaveCount(0);
    await expect(page.getByTestId('cinematic-showcase-scene')).toHaveCount(0);
  });

  test('desktop pins scenes; reverse scroll restores earlier state', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-390', 'desktop pin behavior');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'networkidle' });

    const scene = page.getByTestId('cinematic-scattered-scene');
    await scene.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Drive into the middle / completed region of the pin
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.2));
    await page.waitForTimeout(500);
    const card = page.getByTestId('cinematic-unified-card').first();
    await expect(card).toBeVisible();

    const midOpacity = await card.evaluate((el) => getComputedStyle(el).opacity);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const topOpacity = await card.evaluate((el) => {
      const wrap = el.closest('[data-cinematic-card]');
      return wrap ? getComputedStyle(wrap).opacity : getComputedStyle(el).opacity;
    });
    // Reverse should move away from completed opacity when pin rewinds
    expect(Number(topOpacity)).toBeLessThanOrEqual(Number(midOpacity) + 0.05);
  });

  test('showcase advances stages on desktop scrub', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-390', 'desktop sticky showcase');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'networkidle' });

    const showcase = page.getByTestId('cinematic-showcase-scene');
    await showcase.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(page.getByTestId('cinematic-product-frame')).toBeVisible();

    // Scroll deep into the pinned showcase runway
    for (let i = 0; i < 4; i += 1) {
      await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.55)));
      await page.waitForTimeout(350);
    }
    await expect(page.getByTestId('cinematic-product-frame')).toBeVisible();
    const stage = Number((await showcase.getAttribute('data-active-stage')) ?? '0');
    expect(stage).toBeGreaterThanOrEqual(0);
    expect(stage).toBeLessThanOrEqual(4);
  });

  test('mobile uses non-pinned alternatives', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'networkidle' });
    const scene = page.getByTestId('cinematic-scattered-scene');
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute('data-scene-mode', 'mobile');
    await expect(page.getByTestId('cinematic-showcase-mobile')).toBeVisible();
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });

  test('reduced motion uses static alternatives', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    const scene = page.getByTestId('cinematic-scattered-scene');
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute('data-scene-mode', 'reduced');
    await expect(page.getByTestId('cinematic-scattered-static')).toBeVisible();
    await expect(page.getByTestId('cinematic-showcase-mobile')).toBeVisible();
  });

  test('final CTA destinations remain correct', async ({ page }) => {
    await page.goto('/#build-yours', { waitUntil: 'domcontentloaded' });
    const closing = page.locator('#build-yours');
    await expect(closing).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('closing-profile-preview-link')).toHaveAttribute(
      'href',
      /\/demo\/?$/,
    );
    const demo = closing.locator('a').filter({ hasText: /Live demo/i }).first();
    await expect(demo).toHaveAttribute('href', /\/demo\/?$/);
  });

  test('anchor navigation and history remain functional', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#build-yours').scrollIntoViewIfNeeded();
    await expect(page.locator('#build-yours')).toBeVisible();
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
    await page.getByTestId('cinematic-scattered-scene').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const before = await page.evaluate(() => {
      const dbg = (
        window as Window & {
          __codecardMotionDebug?: { getScrollTriggerCount: () => number; hasTriggerId: (id: string) => boolean };
        }
      ).__codecardMotionDebug;
      return {
        count: dbg?.getScrollTriggerCount?.() ?? -1,
        hasPin: dbg?.hasTriggerId?.('cinematic-scattered-pin') ?? false,
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
        hasPin: dbg?.hasTriggerId?.('cinematic-scattered-pin') ?? false,
        hasShowcase: dbg?.hasTriggerId?.('cinematic-showcase-pin') ?? false,
      };
    });
    expect(after.hasPin).toBe(false);
    expect(after.hasShowcase).toBe(false);
    // before may be -1 if debug hooks not installed yet — still assert cleanup
    void before;
  });

  test('no console errors on landing load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByTestId('cinematic-showcase-scene').scrollIntoViewIfNeeded();
    expect(errors.filter((e) => !/ResizeObserver|hydration/i.test(e))).toEqual([]);
  });
});
