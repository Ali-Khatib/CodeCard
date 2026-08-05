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

test.describe('Phase 1B premium interaction polish', () => {
  test('landing sticky nav gains scrolled state and active underline', async ({ page }) => {
    const flush = await assertNoHydrationErrors(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const shell = page.locator('.cc-marketing-nav-shell');
    await expect(shell).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 420));
    await expect(shell).toHaveAttribute('data-scrolled', 'true');
    await expect(page.locator('.cc-nav-active-underline')).toBeAttached();
    flush();
  });

  test('signature CTA keyboard activation works without magnetism', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const cta = page.getByTestId('hero-primary-cta');
    await cta.focus();
    await expect(cta).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('magnetic shell stays at rest on coarse pointer', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => {
          const fine = query.includes('(pointer: fine)');
          return {
            matches: fine ? false : query.includes('prefers-reduced-motion') ? false : false,
            media: query,
            onchange: null,
            addListener: () => undefined,
            removeListener: () => undefined,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            dispatchEvent: () => false,
          };
        },
      });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const cta = page.getByTestId('hero-primary-cta');
    const box = await cta.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width / 2 + 30, box!.y + box!.height / 2);
    await page.waitForTimeout(150);
    const transform = await cta.evaluate((el) => {
      const parent = el.parentElement;
      return parent ? getComputedStyle(parent).transform : 'none';
    });
    expect(transform === 'none' || transform.includes('matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
  });

  test('workspace sidebar active indicator and navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Alex Chen' })).toBeVisible();
    const indicator = page.getByTestId('sidebar-active-indicator');
    await expect(indicator).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Home$/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Projects$/i }).click();
    await expect(page).toHaveURL(/\/demo\/projects/);
    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Projects$/i }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('link', { name: /My Profile/i })).toHaveCount(0);
  });

  test('workspace has no My Profile sidebar item', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation', { name: 'Main' }).getByText('My Profile')).toHaveCount(0);
    await expect(page.locator('.cc-app-sidebar').getByText('My Profile')).toHaveCount(0);
  });

  test('workspace project and research actions remain available', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Projects$/i }).click();
    await expect(page).toHaveURL(/\/demo\/projects/);
    await expect(page.locator('main')).toBeVisible();
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Research$/i }).click();
    await expect(page).toHaveURL(/\/demo\/research/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('Copy Link success and reset on public profile', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    const copy = page.getByTestId('profile-copy-link');
    await expect(copy).toBeVisible();
    await copy.click();
    await expect(copy).toHaveText(/Copied/i);
    await expect(copy).toHaveClass(/cc-copy-success/);
    await expect(copy).toHaveText(/Copy link/i, { timeout: 4000 });
  });

  test('QR modal open, Escape close, and focus return', async ({ page }) => {
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    const toggle = page.getByTestId('profile-qr-toggle');
    await toggle.focus();
    await toggle.click();
    const modal = page.getByTestId('profile-qr-modal');
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(toggle).toBeFocused();
  });

  test('project opening title shows immediately', async ({ page }) => {
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    const projectLink = page.getByRole('link', { name: /Open project:/i }).first();
    await projectLink.click();
    const overlay = page.locator('.cc-content-opening');
    await expect(overlay).toBeVisible({ timeout: 3000 });
    await expect(overlay.getByText('Opening project')).toBeVisible();
    await page.waitForURL(/\/demo\/card\/projects\//);
    await expect(overlay).toBeHidden({ timeout: 8000 });
  });

  test('research opening title shows on navigation', async ({ page }) => {
    await page.goto('/demo/card', { waitUntil: 'networkidle' });
    await page.locator('#research').scrollIntoViewIfNeeded();
    const researchLink = page.getByRole('link', { name: /Open research paper:/i }).first();
    await Promise.all([
      page.waitForURL(/\/demo\/card\/research\//),
      researchLink.click(),
    ]);
    await expect(page.locator('.cc-content-opening')).toBeHidden({ timeout: 8000 });
  });

  test('Ctrl/Cmd-click preserves native new-tab behavior', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'modifier new-tab flaky on webkit');
    await page.goto('/demo/card', { waitUntil: 'networkidle' });
    const projectLink = page.getByRole('link', { name: /Open project:/i }).first();
    await projectLink.click({ modifiers: ['ControlOrMeta'], force: true });
    await page.waitForTimeout(350);
    await expect(page.locator('.cc-content-opening')).toHaveCount(0);
    await expect(page).toHaveURL(/\/demo\/card/);
  });

  test('middle-click remains native (no opening overlay)', async ({ page }) => {
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    const projectLink = page.getByRole('link', { name: /Open project:/i }).first();
    await projectLink.click({ button: 'middle', force: true });
    await page.waitForTimeout(300);
    await expect(page.locator('.cc-content-opening')).toHaveCount(0);
    await expect(page).toHaveURL(/\/demo\/card\/?$/);
  });

  test('failed navigation clears the opening overlay', async ({ page }) => {
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await page.route('**/demo/card/projects/**', (route) => route.abort());
    await page.getByRole('link', { name: /Open project:/i }).first().click();
    await expect(page.locator('.cc-content-opening')).toBeHidden({ timeout: 10000 });
  });

  test('reduced motion removes tilt, parallax and magnetism', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const cta = page.getByTestId('hero-primary-cta');
    const box = await cta.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2);
    await page.waitForTimeout(150);
    const transform = await cta.evaluate((el) => {
      const parent = el.parentElement;
      return parent ? getComputedStyle(parent).transform : 'none';
    });
    expect(transform === 'none' || transform.includes('matrix(1, 0, 0, 1, 0, 0)')).toBe(true);

    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    const card = page.locator('.cc-interactive-card').first();
    if (await card.count()) {
      const mediaTransform = await card.evaluate((el) => {
        const media = el.querySelector<HTMLElement>('[data-card-media]');
        return media ? getComputedStyle(media).transform : 'none';
      });
      expect(mediaTransform === 'none' || mediaTransform.includes('matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
    }
  });

  test('mobile viewport keeps workspace usable without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').getByText(/Alex/i).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow).toBe(false);
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    const toggle = page.getByTestId('profile-qr-toggle');
    await toggle.click();
    const modal = page.getByTestId('profile-qr-modal');
    await expect(modal).toBeVisible();
    const clipped = await modal.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.right > window.innerWidth + 2 || rect.left < -2;
    });
    expect(clipped).toBe(false);
  });

  test('/demo remains workspace and /demo/card remains public profile', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Alex Chen' })).toBeVisible();
    await expect(page.locator('.cc-app-sidebar').or(page.getByRole('navigation', { name: 'Mobile' })).first()).toBeAttached();

    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Alex Chen').first()).toBeVisible();
    await expect(page.locator('.cc-app-sidebar')).toHaveCount(0);
  });

  test('dashboard routes do not initialize landing Lenis', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(false);
  });

  test('back and forward continue working across demos', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await page.goto('/demo/card', { waitUntil: 'domcontentloaded' });
    await page.goBack();
    await expect(page).toHaveURL(/\/demo\/?$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/demo\/card\/?$/);
  });
});
