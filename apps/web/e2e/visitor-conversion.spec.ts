import { expect, test, type Page } from '@playwright/test';

const PROMPT = '[data-testid="sitewide-visitor-conversion-prompt"]';
const DELAY_MS = 8_000;

async function prepareAnonymousPrompt(page: Page) {
  await page.addInitScript(() => {
    window.__CODECARD_E2E_ALLOW_VISITOR_PROMPT__ = true;
    if (window.sessionStorage.getItem('__codecard_prompt_test_initialized') !== '1') {
      window.sessionStorage.clear();
      window.localStorage.removeItem('codecard:visitor-conversion:dismissed-at');
      window.sessionStorage.setItem('__codecard_prompt_test_initialized', '1');
    }
  });
  await page.clock.install({ time: new Date('2026-07-18T08:00:00Z') });
}

async function advanceToReadyPrompt(page: Page, pathname: string) {
  await prepareAnonymousPrompt(page);
  await page.goto(pathname, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main')).toBeVisible();
  await page.clock.runFor(100);
  await expect(page.locator('html')).toHaveAttribute(
    'data-visitor-conversion-timer',
    'ready',
  );
  await page.clock.runFor(DELAY_MS);
  await expect(page.locator(PROMPT)).toBeVisible();
}

test.describe('site-wide anonymous visitor conversion prompt', () => {
  test('waits eight visible seconds, stays non-modal, and suppresses the session', async ({
    page,
  }) => {
    await prepareAnonymousPrompt(page);
    await page.goto('/landing', { waitUntil: 'domcontentloaded' });
    const focusTarget = page.locator('main a, main button').first();
    await expect(focusTarget).toBeVisible();
    await focusTarget.focus();

    await page.clock.runFor(100);
    await expect(page.locator('html')).toHaveAttribute(
      'data-visitor-conversion-timer',
      'ready',
    );
    await expect(page.locator(PROMPT)).toHaveCount(0, { timeout: 1 });
    await page.clock.runFor(DELAY_MS);

    const prompt = page.locator(PROMPT);
    await expect(prompt).toBeVisible();
    await expect(prompt).toHaveAttribute('role', 'region');
    await expect(focusTarget).toBeFocused();
    await expect(page.locator('main')).not.toHaveAttribute('inert', /.*/);
    await expect(prompt.getByRole('heading', { name: 'Build your own CodeCard' })).toBeVisible();
    await expect(prompt.getByRole('link', { name: 'Create your CodeCard' })).toHaveAttribute(
      'href',
      /^\/sign-up\?source=marketing/,
    );
    await expect(prompt.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      /^\/sign-in\?source=marketing/,
    );
    await expect(prompt.getByText(/Get the .*app|iOS app|Android app/i)).toHaveCount(0);

    await prompt.getByRole('button', { name: 'Dismiss CodeCard account prompt' }).click();
    await expect(prompt).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        window.localStorage.getItem('codecard:visitor-conversion:dismissed-at'),
      ),
    ).toMatch(/^\d+$/);

    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await page.clock.fastForward(20_000);
    await expect(page.locator(PROMPT)).toHaveCount(0);
  });

  test('pauses while hidden', async ({ page }) => {
    await prepareAnonymousPrompt(page);
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await page.clock.runFor(100);
    await expect(page.locator('html')).toHaveAttribute(
      'data-visitor-conversion-timer',
      'ready',
    );
    await page.clock.runFor(3_000);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(20_000);
    await expect(page.locator(PROMPT)).toHaveCount(0, { timeout: 1 });
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(DELAY_MS);
    await expect(page.locator(PROMPT)).toBeVisible();
  });

  test('uses demo copy and keeps demo navigation interactive', async ({ page }) => {
    await advanceToReadyPrompt(page, '/demo/card');
    const prompt = page.locator(PROMPT);
    await expect(prompt.getByText('CodeCard Demo')).toBeVisible();
    await expect(prompt.getByRole('heading', { name: 'Like what you’re exploring?' })).toBeVisible();
    await expect(prompt.getByRole('button', { name: 'Keep exploring' })).toBeVisible();
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.getByText('DevFlow').first()).toBeVisible();
  });

  for (const pathname of [
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/legal/privacy',
    '/admin',
  ]) {
    test(`never appears on excluded route ${pathname}`, async ({ page }) => {
      await prepareAnonymousPrompt(page);
      await page.goto(pathname, { waitUntil: 'domcontentloaded' });
      await page.clock.fastForward(20_000);
      await expect(page.locator(PROMPT)).toHaveCount(0);
    });
  }

  for (const width of [375, 390, 414, 430]) {
    test(`fits ${width}px with practical touch targets`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width, height: 844 });
      await advanceToReadyPrompt(page, '/pricing');
      const prompt = page.locator(PROMPT);
      const box = await prompt.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);

      const metrics = await prompt.evaluate((element) => {
        const clientWidth = document.documentElement.clientWidth;
        const scrollWidth = Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        );
        element.setAttribute('hidden', '');
        const scrollWidthWithoutPrompt = Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        );
        element.removeAttribute('hidden');
        return { clientWidth, scrollWidth, scrollWidthWithoutPrompt };
      });
      expect(metrics.scrollWidth).toBeLessThanOrEqual(
        Math.max(metrics.clientWidth + 1, metrics.scrollWidthWithoutPrompt),
      );

      for (const control of await prompt.locator('a, button').all()) {
        const controlBox = await control.boundingBox();
        expect(controlBox?.height ?? 0).toBeGreaterThanOrEqual(43.9);
      }
    });
  }

  test('reduced motion uses opacity without translation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await advanceToReadyPrompt(page, '/pricing');
    const style = await page.locator(PROMPT).evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        animationName: computed.animationName,
        transform: computed.transform,
        position: computed.position,
      };
    });
    expect(style.animationName).toContain('cc-visitor-prompt-fade');
    expect(style.transform).toBe('none');
    expect(style.position).toBe('fixed');
  });
});
