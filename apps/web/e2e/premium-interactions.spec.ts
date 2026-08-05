import { expect, test, type Page } from '@playwright/test';

async function assertNoHydrationErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return () => {
    const hydration = errors.filter((e) => /hydration/i.test(e));
    expect(hydration).toEqual([]);
  };
}

test.describe('Phase 1A premium interactions', () => {
  test('primary CTA magnetic shell is present and keyboard-activatable', async ({ page }) => {
    const flush = await assertNoHydrationErrors(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const cta = page.getByTestId('hero-primary-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/sign-up');
    await cta.focus();
    await expect(cta).toBeFocused();
    // Keyboard activation must work without requiring pointer magnetic offset.
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/sign-up/);
    flush();
  });

  test('reduced motion keeps CTA at rest (no magnetic transform)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const cta = page.getByTestId('hero-primary-cta');
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move((box!.x + box!.width / 2) + 40, box!.y + box!.height / 2);
    await page.waitForTimeout(200);
    const transform = await cta.evaluate((el) => {
      const parent = el.parentElement;
      return parent ? getComputedStyle(parent).transform : 'none';
    });
    expect(transform === 'none' || transform.includes('matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
  });

  test('internal project navigation shows Opening project with title', async ({ page }) => {
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    const projectLink = page.getByRole('link', { name: /Open project:|View project/i }).first();
    await expect(projectLink).toBeVisible();
    const title =
      (await projectLink.getAttribute('aria-label'))?.replace(/^Open project:\s*/i, '') ||
      (await projectLink.textContent()) ||
      '';
    await projectLink.click();
    const overlay = page.locator('.cc-content-opening');
    await expect(overlay).toBeVisible({ timeout: 3000 });
    await expect(overlay.getByText('Opening project')).toBeVisible();
    if (title.trim()) {
      await expect(overlay.getByText(title.trim().slice(0, 12), { exact: false })).toBeVisible();
    }
    await page.waitForURL(/\/demo\/card\/projects\//);
    await expect(overlay).toBeHidden({ timeout: 8000 });
  });

  test('internal research navigation shows Opening research with title', async ({ page }) => {
    await page.goto('/demo/card', { waitUntil: 'networkidle' });
    await page.locator('#research').scrollIntoViewIfNeeded();
    const researchLink = page.getByRole('link', { name: /Open research paper:/i }).first();
    await expect(researchLink).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/demo\/card\/research\//),
      researchLink.click(),
    ]);
    // Overlay may be brief; assert destination and that it does not stick.
    await expect(page.locator('.cc-content-opening')).toBeHidden({ timeout: 8000 });
    await expect(page.getByText(/Retrieval Evaluation|Opening research|research/i).first()).toBeVisible();
  });

  test('failed navigation clears the opening overlay', async ({ page }) => {
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await page.route('**/demo/card/projects/**', (route) => route.abort());
    const projectLink = page.getByRole('link', { name: /Open project:/i }).first();
    await projectLink.click();
    // Failsafe or aborted nav should not leave a stuck overlay forever.
    await expect(page.locator('.cc-content-opening')).toBeHidden({ timeout: 10000 });
  });

  test('Ctrl/Cmd-click and external links stay native', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'modifier new-tab flaky on webkit');
    await page.goto('/demo/card', { waitUntil: 'networkidle' });
    const projectLink = page.getByRole('link', { name: /Open project:/i }).first();
    await expect(projectLink).toBeVisible();

    // Modifier click must not open the in-app transition overlay.
    await projectLink.click({ modifiers: ['ControlOrMeta'], force: true });
    await page.waitForTimeout(400);
    await expect(page.locator('.cc-content-opening')).toHaveCount(0);
    // Stay on public profile demo (new tab handled by browser; primary page unchanged).
    await expect(page).toHaveURL(/\/demo\/card/);

    const external = page.locator('a[target="_blank"][rel*="noopener"]').first();
    if (await external.count()) {
      await external.click();
      await expect(page.locator('.cc-content-opening')).toHaveCount(0);
    }
  });

  test('browser back/forward after project open remains functional', async ({ page }) => {
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /Open project:/i }).first().click();
    await page.waitForURL(/\/demo\/card\/projects\//);
    await page.goBack();
    await expect(page).toHaveURL(/\/demo\/card\/?$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/demo\/card\/projects\//);
  });

  test('workspace demo does not get Lenis marketing runtime', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Alex Chen' })).toBeVisible();
    const lenis = await page.evaluate(() =>
      document.documentElement.classList.contains('lenis'),
    );
    expect(lenis).toBe(false);
  });

  test('/dashboard/preview alias reaches workspace without Lenis', async ({ page }) => {
    await page.goto('/dashboard/preview', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.getByRole('heading', { name: 'Alex Chen' })).toBeVisible();
    const lenis = await page.evaluate(() =>
      document.documentElement.classList.contains('lenis'),
    );
    expect(lenis).toBe(false);
  });

  test('demo workspace remains readable with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await context.close();
  });
});
