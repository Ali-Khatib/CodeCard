import { expect, test } from '@playwright/test';

test.describe('Editorial product landing', () => {
  test('hero content exists before motion runtime', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toContain('YOUR WORK.');
    expect(html).toMatch(/One identity/i);
    expect(html).not.toMatch(/View Public Profile/i);
    await expect(page.locator('[data-hero-statement]').first()).toBeVisible();
    await expect(page.getByTestId('hero-primary-cta')).toHaveAttribute('href', '/sign-up');
  });

  test('analysis, circle, connections, live demo, audience, and research proof mount', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('editorial-landing')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('editorial-network-bridge')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/not just/i).first()).toBeVisible();
    await expect(page.getByTestId('editorial-network-pair')).toBeVisible();
    await expect(page.getByTestId('editorial-story-circle')).toBeVisible();
    await expect(page.getByTestId('editorial-story-connections')).toBeVisible();
    await expect(page.getByTestId('editorial-analysis')).toBeVisible();
    await expect(page.getByText(/MAKE IT VISIBLE/i).first()).toBeVisible();
    await expect(page.getByTestId('editorial-analysis').getByText(/Analysis/i).first()).toBeVisible();
    await expect(page.getByTestId('editorial-live-demo-box')).toBeVisible();
    await expect(page.getByTestId('editorial-audience')).toBeVisible();
    await expect(page.getByTestId('editorial-research-proof')).toBeVisible();
    await expect(page.getByTestId('editorial-moving-cards')).toHaveCount(0);
    await expect(page.getByTestId('editorial-story-impact')).toHaveCount(0);
    await expect(page.getByText(/\bIMPACT\b/)).toHaveCount(0);
  });

  test('CTA destinations remain correct', async ({ page }) => {
    await page.goto('/#build-yours', { waitUntil: 'domcontentloaded' });
    const closing = page.locator('#build-yours');
    await expect(closing).toBeVisible({ timeout: 20000 });
    await expect(closing.locator('a').filter({ hasText: /Open Live Demo/i }).first()).toHaveAttribute(
      'href',
      /\/demo\/?$/,
    );
    await expect(closing.locator('a[href="/demo/card"]')).toHaveCount(0);
  });

  test('mobile has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByTestId('editorial-analysis').scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });

  test('reduced motion keeps sections readable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('editorial-analysis')).toBeVisible();
    await expect(page.getByTestId('editorial-live-demo-box')).toBeVisible();
    await expect(page.getByTestId('editorial-finale')).toBeVisible();
  });
});
