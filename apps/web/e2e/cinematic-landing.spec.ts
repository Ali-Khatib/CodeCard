import { expect, test } from '@playwright/test';

test.describe('Proof dossier landing', () => {
  test('hero statement exists before motion runtime', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toContain('YOUR WORK');
    expect(html).toContain('data-hero-statement');
    await expect(page.getByTestId('hero-section').locator('[data-hero-statement]').first()).toBeVisible();
    await expect(page.getByTestId('hero-primary-cta')).toBeVisible();
  });

  test('proof landing mounts on / only', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('proof-landing')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('proof-cold-open')).toBeVisible();

    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('proof-landing')).toHaveCount(0);

    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('proof-landing')).toHaveCount(0);
  });

  test('evidence wall and finale are reachable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('proof-landing')).toBeVisible({ timeout: 15000 });

    await page.locator('#evidence').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await expect(page.getByTestId('proof-evidence-wall')).toBeVisible();

    // Pin/scrub scenes can detach intermediate locators during travel — re-query by id.
    await page.locator('#build-yours').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await expect(page.locator('#build-yours')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('proof-finale')).toBeVisible();
  });

  test('final CTA destinations remain correct', async ({ page }) => {
    await page.goto('/#build-yours', { waitUntil: 'domcontentloaded' });
    const closing = page.locator('#build-yours');
    await expect(closing).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('closing-profile-preview-link')).toHaveAttribute(
      'href',
      '/demo/card',
    );
    const demo = closing.locator('a').filter({ hasText: /live workspace/i }).first();
    await expect(demo).toHaveAttribute('href', /\/demo\/?$/);
    const signup = closing.locator('a').filter({ hasText: /Create your CodeCard/i }).first();
    await expect(signup).toHaveAttribute('href', /\/sign-up/);
  });

  test('reduced motion still shows proof narrative', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('proof-landing')).toBeVisible();
    await expect(page.getByTestId('proof-evidence-wall')).toBeVisible();
    const inspect = page.getByTestId('proof-inspection');
    await inspect.scrollIntoViewIfNeeded();
    await expect(inspect).toHaveAttribute('data-scene-mode', 'reduced');
  });

  test('no console errors on landing load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByTestId('proof-cold-open').scrollIntoViewIfNeeded();
    expect(errors.filter((e) => !/ResizeObserver|hydration/i.test(e))).toEqual([]);
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
});
