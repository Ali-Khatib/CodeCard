import { test, expect } from '@playwright/test';

/**
 * Auth smoke tests — deterministic, no production credentials.
 * Live OAuth/email delivery requires a staging Supabase project (see docs/AUTH_PROVIDER_CONFIGURATION.md).
 */
test.describe('Authentication pages', () => {
  test.setTimeout(60000);

  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Sign in to CodeCard/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Sign in$/i })).toBeVisible();
  });

  test('sign-up page loads', async ({ page }) => {
    await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Create your CodeCard/i })).toBeVisible();
    await expect(page.getByLabel('Display name')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create account/i })).toBeVisible();
  });

  test('sign-in shows validation error for invalid email', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: /^Sign in$/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).not.toContainText(/access_token|refresh_token|code=/i);
  });

  test('sign-in form exposes loading accessibility state', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('form[aria-busy]')).toHaveAttribute('aria-busy', 'false');
  });

  test('forgot-password page loads with reset form', async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Reset your password/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: /Send reset link/i })).toBeVisible();
  });

  test('reset-password rejects missing recovery session safely', async ({ page }) => {
    await page.goto('/reset-password', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Reset link unavailable/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/expired|used/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Request new link/i })).toBeVisible();
  });

  test('auth error page shows safe OAuth failure copy', async ({ page }) => {
    await page.goto('/auth/error?reason=missing_code', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Sign-in incomplete/i })).toBeVisible();
    await expect(page.getByText(/couldn't complete sign-in/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Try again/i })).toBeVisible();
    await expect(page.getByText(/access_token|refresh_token|authorization code/i)).toHaveCount(0);
  });

  test('expired-session message appears on sign-in', async ({ page }) => {
    await page.goto('/sign-in?reason=session_expired&redirect=/dashboard/projects', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText(/session expired/i)).toBeVisible();
  });

  test('unsafe redirect query does not break sign-in page', async ({ page }) => {
    await page.goto('/sign-in?redirect=https%3A%2F%2Fevil.example', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByRole('heading', { name: /Sign in to CodeCard/i })).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('unauthenticated dashboard access redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15000 });
    expect(page.url()).not.toMatch(/access_token|refresh_token|code=/);
  });

  test('auth routes work regardless of home route (mvp/main safe)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Sign in to CodeCard/i })).toBeVisible();
  });
});
