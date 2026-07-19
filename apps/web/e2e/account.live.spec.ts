import type { Page } from '@playwright/test';
import {
  test,
  expect,
  signInViaUI,
  createAdminUser,
  type ProvisionedUser,
} from './support/auth.fixtures';

/**
 * WS14-T007 — account export and deletion E2E against the ISOLATED real
 * Supabase backend (never production). Exercises the no-subscription path
 * (STRIPE_SECRET_KEY is a test-mode placeholder; Stripe API is never called
 * when the account has no customer). Disposable users are registered for
 * cleanup; deleters tolerate the flow having already removed them.
 */

test.describe.configure({ mode: 'serial' });

let owner: ProvisionedUser;

async function openSettings(page: Page): Promise<void> {
  await signInViaUI(page, { email: owner.email, password: owner.password });
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
  // Settings is sectioned — export/deletion live under "Sessions & data".
  await page.getByRole('button', { name: /Sessions & data/i }).click();
  await expect(page.getByTestId('account-deletion-open')).toBeVisible({ timeout: 30_000 });
}

test.describe('WS14-T007 account export and deletion E2E (isolated real backend)', () => {
  test('provision disposable owner for export + deletion', async ({
    admin,
    env,
    run,
    registry,
  }) => {
    const slug = `ws14-t007-${run.runUuid.slice(0, 8)}`;
    owner = await createAdminUser(admin, env, registry, {
      slug,
      displayName: 'WS14 T007 Owner',
      workerIndex: 70,
    });
  });

  test('export downloads a JSON account archive for the authenticated owner', async ({
    page,
  }) => {
    await openSettings(page);

    const downloadPromise = page.waitForEvent('download', { timeout: 45_000 });
    await page.getByRole('button', { name: /Download account data as JSON/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^codecard-account-export-\d{4}-\d{2}-\d{2}\.json$/,
    );

    const path = await download.path();
    expect(path).toBeTruthy();
    const raw = await page.evaluate(async (p) => {
      // Node-side read via Playwright's download path is more reliable than
      // re-fetching; we stream the file contents through the test runner.
      return p;
    }, path);
    const fs = await import('node:fs/promises');
    const text = await fs.readFile(String(raw), 'utf8');
    const doc = JSON.parse(text) as {
      schema_version?: string;
      account?: { user_id?: string; email?: string };
      profile?: { slug?: string };
    };

    expect(doc.schema_version).toBeTruthy();
    expect(doc.account?.user_id).toBe(owner.id);
    expect(doc.account?.email).toBe(owner.email);
    expect(doc.profile?.slug).toBe(owner.slug);
    // Forbidden leak classes.
    expect(text).not.toMatch(/sk_live_|rk_live_|service_role|storage\/v1\/object\/sign/i);

    await expect(
      page.getByTestId('mutation-toast-success').filter({ hasText: /Account export ready/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('deletion dialog requires the exact DELETE confirmation and password reauth', async ({
    page,
    env,
  }) => {
    await openSettings(page);
    await page.getByTestId('account-deletion-open').click();
    await expect(page.getByTestId('account-deletion-dialog')).toBeVisible();
    await expect(page.getByText('Delete your CodeCard account?')).toBeVisible();

    const submit = page.getByTestId('account-deletion-submit');
    await expect(submit).toBeDisabled();

    // Lowercase must not enable submit.
    await page.getByTestId('account-deletion-confirmation').fill('delete');
    await expect(submit).toBeDisabled();

    await page.getByTestId('account-deletion-confirmation').fill('DELETE');
    // Password reauth is still required.
    await expect(submit).toBeDisabled();

    await page.getByTestId('account-deletion-password').fill(env.testPassword);
    await page.getByRole('button', { name: /^Verify password$/ }).click();
    await expect(page.getByText(/Password verified/i)).toBeVisible({ timeout: 20_000 });
    await expect(submit).toBeEnabled();

    // Cancel without deleting so the next test owns the destructive path.
    await page.getByRole('button', { name: /^Cancel$/ }).click();
    await expect(page.getByTestId('account-deletion-dialog')).toHaveCount(0);
  });

  test('hard-delete removes the auth user and profile; session is invalidated', async ({
    page,
    admin,
    env,
  }) => {
    await openSettings(page);
    await page.getByTestId('account-deletion-open').click();
    await expect(page.getByTestId('account-deletion-dialog')).toBeVisible();

    await page.getByTestId('account-deletion-confirmation').fill('DELETE');
    await page.getByTestId('account-deletion-password').fill(env.testPassword);
    await page.getByRole('button', { name: /^Verify password$/ }).click();
    await expect(page.getByText(/Password verified/i)).toBeVisible({ timeout: 20_000 });

    await page.getByTestId('account-deletion-submit').click();
    await page.waitForURL(/\/sign-in\?reason=account_deleted/, { timeout: 60_000 });

    // Auth user gone.
    const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(owner.id);
    expect(authErr || !authUser.user).toBeTruthy();

    // Profile row gone.
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', owner.profileId)
      .maybeSingle();
    expect(profile).toBeNull();

    // Session is dead — dashboard bounces to sign-in.
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/sign-in/, { timeout: 30_000 });
  });
});
