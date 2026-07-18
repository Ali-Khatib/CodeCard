import { expect, test, type Page } from '@playwright/test';

const PROMPT = '[data-testid="sitewide-visitor-conversion-prompt"]';
const DELAY_MS = 8_000;
const SHOWN_KEY = 'codecard:visitor-conversion:shown';
const REFUSAL_LABEL = 'No, I’ll keep my work scattered';
const REFUSAL_SUPPORT =
  'I’d rather keep sending people five different links and explaining everything manually.';

async function prepareAnonymousPrompt(page: Page) {
  await page.addInitScript(() => {
    window.__CODECARD_E2E_ALLOW_VISITOR_PROMPT__ = true;
    if (window.sessionStorage.getItem('__codecard_prompt_test_initialized') !== '1') {
      window.sessionStorage.clear();
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
  test('landing waits eight seconds, sets session key only when visible, and refuses without insult', async ({
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
    expect(
      await page.evaluate((key) => window.sessionStorage.getItem(key), SHOWN_KEY),
    ).toBeNull();

    await page.clock.runFor(DELAY_MS);

    const prompt = page.locator(PROMPT);
    await expect(prompt).toBeVisible();
    expect(
      await page.evaluate((key) => window.sessionStorage.getItem(key), SHOWN_KEY),
    ).toBe('true');
    await expect(prompt).toHaveAttribute('role', 'region');
    await expect(focusTarget).toBeFocused();
    await expect(page.locator('main')).not.toHaveAttribute('inert', /.*/);
    await expect(prompt.getByRole('heading', { name: 'Build your own CodeCard' })).toBeVisible();
    await expect(
      prompt.getByText(
        'Give people one place to explore your projects, research, and technical work through a link or QR code.',
      ),
    ).toBeVisible();
    await expect(prompt.getByRole('link', { name: 'Create your CodeCard' })).toHaveAttribute(
      'href',
      /^\/sign-up\?source=marketing/,
    );
    await expect(prompt.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      /^\/sign-in\?source=marketing/,
    );
    await expect(prompt.getByText(/Get the .*app|iOS app|Android app/i)).toHaveCount(0);
    await expect(prompt.getByRole('button', { name: REFUSAL_LABEL })).toBeVisible();
    await expect(prompt.getByText(REFUSAL_SUPPORT)).toBeVisible();

    await prompt.getByRole('button', { name: REFUSAL_LABEL }).click();
    await expect(prompt).toHaveCount(0);
    expect(
      await page.evaluate((key) => window.sessionStorage.getItem(key), SHOWN_KEY),
    ).toBe('true');

    await page.goto('/dashboard/preview', { waitUntil: 'domcontentloaded' });
    await page.clock.fastForward(20_000);
    await expect(page.locator(PROMPT)).toHaveCount(0);
  });

  test('leaving landing before eight seconds does not set the session key', async ({ page }) => {
    await prepareAnonymousPrompt(page);
    await page.goto('/landing', { waitUntil: 'domcontentloaded' });
    await page.clock.runFor(100);
    await expect(page.locator('html')).toHaveAttribute(
      'data-visitor-conversion-timer',
      'ready',
    );
    await page.clock.runFor(3_000);
    expect(
      await page.evaluate((key) => window.sessionStorage.getItem(key), SHOWN_KEY),
    ).toBeNull();

    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await page.clock.fastForward(20_000);
    await expect(page.locator(PROMPT)).toHaveCount(0);
    expect(
      await page.evaluate((key) => window.sessionStorage.getItem(key), SHOWN_KEY),
    ).toBeNull();
  });

  test('live demo waits eight seconds and suppresses later landing shows', async ({ page }) => {
    await advanceToReadyPrompt(page, '/dashboard/preview');
    const prompt = page.locator(PROMPT);
    await expect(prompt.getByText('CodeCard Demo')).toBeVisible();
    await expect(prompt.getByRole('heading', { name: 'Like what you’re exploring?' })).toBeVisible();
    await expect(
      prompt.getByText(
        'Build your own CodeCard and give people one place to explore your projects, research, and technical work.',
      ),
    ).toBeVisible();
    expect(
      await page.evaluate((key) => window.sessionStorage.getItem(key), SHOWN_KEY),
    ).toBe('true');

    await page.goto('/landing', { waitUntil: 'domcontentloaded' });
    await page.clock.fastForward(20_000);
    await expect(page.locator(PROMPT)).toHaveCount(0);
  });

  test('Escape dismisses and keeps the session key set', async ({ page }) => {
    await advanceToReadyPrompt(page, '/landing');
    const prompt = page.locator(PROMPT);
    await expect(prompt).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(prompt).toHaveCount(0);
    expect(
      await page.evaluate((key) => window.sessionStorage.getItem(key), SHOWN_KEY),
    ).toBe('true');
    await page.goto('/dashboard/preview', { waitUntil: 'domcontentloaded' });
    await page.clock.fastForward(20_000);
    await expect(page.locator(PROMPT)).toHaveCount(0);
  });

  test('pauses while hidden on landing', async ({ page }) => {
    await prepareAnonymousPrompt(page);
    await page.goto('/landing', { waitUntil: 'domcontentloaded' });
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

  for (const pathname of [
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/legal/privacy',
    '/admin',
    '/pricing',
    '/demo/card',
    '/dashboard/preview/projects',
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
      await advanceToReadyPrompt(page, '/landing');
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
    await advanceToReadyPrompt(page, '/landing');
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
