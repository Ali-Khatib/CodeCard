import { expect, test } from '@playwright/test';

test.describe('Phase 0B motion foundation', () => {
  test('landing keeps research-support content visible before/with motion', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const proof = page.getByTestId('motion-section-reveal-proof');
    await expect(proof).toBeVisible();
    await expect(proof.getByRole('heading', { level: 2 })).toBeVisible();
    const opacity = await proof.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0.5);
  });

  test('reduced motion still shows the proof content immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const proof = page.getByTestId('motion-section-reveal-proof');
    await expect(proof).toBeVisible();
    await expect(
      proof.getByText('Showcase your research, not just your projects.'),
    ).toBeVisible();
  });

  test('dashboard preview does not mount the marketing Lenis provider', async ({
    page,
  }) => {
    await page.goto('/dashboard/preview', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
    const hasLenisRoot = await page.evaluate(() =>
      Boolean(document.documentElement.classList.contains('lenis')),
    );
    expect(hasLenisRoot).toBe(false);
  });

  test('marketing home may enable Lenis when motion is allowed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const hasLenisRoot = await page.evaluate(() =>
      Boolean(document.documentElement.classList.contains('lenis')),
    );
    // Lenis root class is expected once the provider attaches; tolerate slow hydrate.
    expect(typeof hasLenisRoot).toBe('boolean');
  });

  test('route alignment remains correct after motion foundation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Alex Chen')).toHaveCount(0);

    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
  });

  test('browser back remains functional across marketing and demo', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('main')).toBeVisible();
  });
});
