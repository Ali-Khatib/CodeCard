import { expect, test, type Page } from '@playwright/test';

async function enableMotionDebug(page: Page) {
  await page.addInitScript(() => {
    (
      window as Window & { __CODECARD_E2E_ALLOW_MOTION_DEBUG__?: boolean }
    ).__CODECARD_E2E_ALLOW_MOTION_DEBUG__ = true;
  });
}

async function waitForMotionDebug(page: Page, timeoutMs = 8000) {
  await page.waitForFunction(
    () =>
      Boolean(
        (window as Window & { __codecardMotionDebug?: unknown }).__codecardMotionDebug,
      ),
    undefined,
    { timeout: timeoutMs },
  );
}

async function getScrollTriggerCount(page: Page) {
  return page.evaluate(
    () =>
      (
        window as Window & {
          __codecardMotionDebug?: { getScrollTriggerCount: () => number };
        }
      ).__codecardMotionDebug?.getScrollTriggerCount() ?? -1,
  );
}

async function isLenisActive(page: Page) {
  return page.evaluate(() => document.documentElement.classList.contains('lenis'));
}

test.describe('Phase 0B motion foundation', () => {
  test('landing keeps research-support content visible before/with motion', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    const proof = page.getByTestId('motion-section-reveal-proof');
    await expect(proof).toBeVisible();
    await expect(proof.getByRole('heading', { level: 2 })).toBeVisible();

    // Content must never be authored as opacity:0 while waiting for GSAP.
    const styleState = await proof.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        opacity: Number(cs.opacity),
        inlineOpacity: el.style.opacity,
        visibility: cs.visibility,
      };
    });
    expect(styleState.visibility).toBe('visible');
    expect(styleState.inlineOpacity === '' || Number(styleState.inlineOpacity) > 0.5).toBe(true);
    // Effective opacity may briefly be affected by unrelated ancestors; require non-zero text paint.
    await expect(proof.getByText('Showcase your research, not just your projects.')).toBeVisible();
    expect(styleState.opacity).toBeGreaterThan(0);

    const hydrationErrors = errors.filter((e) => /hydration/i.test(e));
    expect(hydrationErrors).toEqual([]);
  });

  test('reduced motion disables Lenis and keeps proof untranslated', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const proof = page.getByTestId('motion-section-reveal-proof');
    await expect(proof).toBeVisible();
    await expect(
      proof.getByText('Showcase your research, not just your projects.'),
    ).toBeVisible();

    const state = await proof.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        opacity: Number(style.opacity),
        transform: style.transform,
        lenis: document.documentElement.classList.contains('lenis'),
      };
    });
    expect(state.opacity).toBeGreaterThan(0.5);
    expect(state.lenis).toBe(false);
    expect(state.transform === 'none' || state.transform.includes('matrix(1, 0, 0, 1, 0, 0)')).toBe(
      true,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('PageDown');
    await expect(page.locator('main')).toBeVisible();
  });

  test('dashboard preview does not mount the marketing Lenis provider', async ({
    page,
  }) => {
    await enableMotionDebug(page);
    await page.goto('/dashboard/preview', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
    expect(await isLenisActive(page)).toBe(false);
  });

  test('marketing home enables Lenis once when motion is allowed', async ({ page }) => {
    await enableMotionDebug(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForMotionDebug(page).catch(() => undefined);
    await page.waitForTimeout(500);

    expect(await isLenisActive(page)).toBe(true);
    const debugLenis = await page.evaluate(
      () =>
        (
          window as Window & {
            __codecardMotionDebug?: { getLenisActive: () => boolean };
          }
        ).__codecardMotionDebug?.getLenisActive() ?? false,
    );
    expect(debugLenis).toBe(true);
  });

  test('ScrollTrigger count stays stable across repeated / → /demo → /', async ({
    page,
  }) => {
    await enableMotionDebug(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForMotionDebug(page);
    await page.waitForTimeout(600);
    const before = await getScrollTriggerCount(page);
    expect(before).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < 3; i += 1) {
      await page.goto('/demo', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Alex Chen').first()).toBeVisible();
      await page.goto('/', { waitUntil: 'networkidle' });
      await waitForMotionDebug(page);
      await page.waitForTimeout(500);
    }

    const after = await getScrollTriggerCount(page);
    expect(after).toBe(before);
  });

  test('unmounting marketing does not leave Lenis active on demo', async ({ page }) => {
    await enableMotionDebug(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    expect(await isLenisActive(page)).toBe(true);

    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    expect(await isLenisActive(page)).toBe(false);
  });

  test('scoped provider cleanup leaves unrelated ScrollTrigger alive', async ({ page }) => {
    await enableMotionDebug(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForMotionDebug(page);
    await page.waitForTimeout(500);

    const beforeOwned = await getScrollTriggerCount(page);
    expect(beforeOwned).toBeGreaterThanOrEqual(1);

    const orphanId = await page.evaluate(() => {
      const debug = (
        window as Window & {
          __codecardMotionDebug?: { createOrphanTrigger: () => string };
        }
      ).__codecardMotionDebug;
      if (!debug) throw new Error('motion debug missing');
      return debug.createOrphanTrigger();
    });

    expect(
      await page.evaluate(
        (id) =>
          (
            window as Window & {
              __codecardMotionDebug?: { hasTriggerId: (id: string) => boolean };
            }
          ).__codecardMotionDebug?.hasTriggerId(id) ?? false,
        orphanId,
      ),
    ).toBe(true);

    // Soft-navigate away: marketing provider unmounts. Marker proves soft vs hard nav.
    await page.evaluate(() => {
      (window as Window & { __ccSoftNavMark?: number }).__ccSoftNavMark = 1;
    });
    const demoLink = page.locator('a[href="/demo"]').first();
    await expect(demoLink).toBeVisible();
    await Promise.all([page.waitForURL(/\/demo\/?$/), demoLink.click()]);
    await page.waitForTimeout(500);

    const softNav = await page.evaluate(
      () => (window as Window & { __ccSoftNavMark?: number }).__ccSoftNavMark === 1,
    );

    if (softNav) {
      // Same JS runtime: unrelated orphan must survive marketing provider unmount.
      const orphanAlive = await page.evaluate(
        (id) =>
          (
            window as Window & {
              __codecardMotionDebug?: { hasTriggerId: (id: string) => boolean };
            }
          ).__codecardMotionDebug?.hasTriggerId(id) ?? false,
        orphanId,
      );
      expect(orphanAlive).toBe(true);
    } else {
      // Hard navigation resets the runtime — prove the contrast on a fresh landing load:
      // orphan survives until an explicit global kill (which the provider must not call).
      await page.goto('/', { waitUntil: 'networkidle' });
      await waitForMotionDebug(page);
      const id2 = await page.evaluate(() => {
        const debug = (
          window as Window & {
            __codecardMotionDebug?: { createOrphanTrigger: () => string };
          }
        ).__codecardMotionDebug;
        if (!debug) throw new Error('motion debug missing');
        return debug.createOrphanTrigger();
      });
      expect(
        await page.evaluate(
          (id) =>
            (
              window as Window & {
                __codecardMotionDebug?: { hasTriggerId: (id: string) => boolean };
              }
            ).__codecardMotionDebug?.hasTriggerId(id) ?? false,
          id2,
        ),
      ).toBe(true);
      await page.evaluate(() => {
        (
          window as Window & {
            __codecardMotionDebug?: { killAllScrollTriggers: () => void };
          }
        ).__codecardMotionDebug?.killAllScrollTriggers();
      });
      expect(
        await page.evaluate(
          (id) =>
            (
              window as Window & {
                __codecardMotionDebug?: { hasTriggerId: (id: string) => boolean };
              }
            ).__codecardMotionDebug?.hasTriggerId(id) ?? false,
          id2,
        ),
      ).toBe(false);
    }

    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForMotionDebug(page);
    await page.waitForTimeout(500);
    const remountCount = await getScrollTriggerCount(page);
    expect(remountCount).toBeGreaterThanOrEqual(1);
    expect(remountCount).toBeLessThanOrEqual(beforeOwned + 1);
  });

  test('browser back/forward and refresh remain functional', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('main')).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.getByText('Alex Chen').first()).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
  });

  test('route alignment remains correct after motion foundation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Alex Chen')).toHaveCount(0);

    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
  });

  test('JS-disabled landing content remains readable', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/CodeCard|research|professional|showcase/i);
    await context.close();
  });
});
