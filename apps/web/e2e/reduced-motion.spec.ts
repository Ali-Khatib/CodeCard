import { expect, test } from '@playwright/test';

test.describe('WS12-T006 reduced motion (browser)', () => {
  test('CSS disables smooth scrolling and long animations when reduced', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });

    const metrics = await page.evaluate(() => {
      const html = window.getComputedStyle(document.documentElement);
      const body = window.getComputedStyle(document.body);
      const probe = document.createElement('div');
      probe.className = 'cc-instant-press';
      probe.style.transition = 'transform 0.4s ease';
      document.body.appendChild(probe);
      const probeStyle = window.getComputedStyle(probe);
      const duration = probeStyle.transitionDuration;
      probe.remove();
      return {
        htmlScroll: html.scrollBehavior,
        bodyScroll: body.scrollBehavior,
        probeDuration: duration,
      };
    });

    expect(metrics.htmlScroll === 'auto' || metrics.bodyScroll === 'auto').toBe(
      true,
    );
    // Global reduce media forces near-zero transition duration.
    const ms = Number.parseFloat(metrics.probeDuration);
    expect(Number.isFinite(ms) ? ms : 0).toBeLessThan(0.05);
  });

  test('skip link and main landmark remain usable under reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await skip.click();
    await expect(page).toHaveURL(/#main-content$/);
    await expect(page.locator('main#main-content')).toHaveCount(1);
    await expect(page.locator('main#main-content')).toBeFocused();
  });

  test('demo remains functional with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('main#main-content')).toHaveCount(1);
  });
});
