import {
  test,
  expect,
  signInViaUI,
  signOutViaUI,
  signUpViaUI,
  waitForProvisionedProfile,
  registerUserFixtures,
  adminConfirmEmail,
  isEmailConfirmed,
  getAuthUser,
  createAdminUser,
  type ProvisionedUser,
} from './support/auth.fixtures';
import { isolatedSupabaseHost, loadIsolatedE2EEnv } from './support/isolated-e2e';
import {
  loadMailtrapConfig,
  waitForMessageTo,
  extractFirstLink,
  deleteMessage,
  cleanupRunMessages,
} from './support/mailtrap';
import {
  validateE2EEnvironment,
  PRODUCTION_SUPABASE_PROJECT_REF,
  PRODUCTION_SUPABASE_URL,
} from '../src/lib/e2e/env-guard';
import { createE2ERunIdentity, disposableFixtureEmail } from '../src/lib/e2e/run-id';

/**
 * WS14-T002 — authentication E2E against the ISOLATED real Supabase backend.
 *
 * The webServer (playwright.e2e.config.ts) builds + serves the app with the
 * isolated project's public keys baked in, and every request is checked against
 * a production tripwire (auth.fixtures.ts). No production service is ever
 * contacted. Disposable users are cleaned in worker teardown.
 *
 * Email DELIVERY is out of scope: the disposable mailbox domain is a reserved
 * non-deliverable domain and the isolated project uses Supabase's default email
 * service with no capture. Reset-EMAIL delivery is therefore reported UNVERIFIED
 * (see the final report); reset-request + reset-route security are covered here.
 */

const isolatedHost = isolatedSupabaseHost(loadIsolatedE2EEnv());
const NO_VISITOR_PROMPT = '[class*="cc-visitor-prompt"]';

test.describe.configure({ mode: 'serial' });

let primary: ProvisionedUser;
/** True when the isolated project requires email confirmation (Supabase default). */
let confirmationRequired = false;

test.describe('WS14-T002 authentication E2E (isolated real backend)', () => {
  test('environment guard rejects the production Supabase project', () => {
    const result = validateE2EEnvironment({
      CODECARD_E2E: '1',
      CODECARD_E2E_ALLOW_DESTRUCTIVE: '1',
      CODECARD_E2E_SUPABASE_URL: PRODUCTION_SUPABASE_URL,
      CODECARD_E2E_SUPABASE_PUBLISHABLE_KEY: 'x',
      CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY: 'x',
      CODECARD_E2E_SUPABASE_PROJECT_REF: PRODUCTION_SUPABASE_PROJECT_REF,
      CODECARD_E2E_TEST_PASSWORD: 'x',
      CODECARD_E2E_BASE_URL: 'http://localhost:3100',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures).toContain('production_project_ref_forbidden');
      expect(result.failures).toContain('production_supabase_url_forbidden');
    }
  });

  test('real-UI sign-up provisions tenant, membership and profile without admin metadata', async ({
    page,
    admin,
    env,
    run,
    registry,
  }) => {
    const slug = `ws14-primary-${run.runUuid.slice(0, 8)}`;
    const email = disposableFixtureEmail({ runId: run.runId, workerIndex: 0, emailDomain: env.emailDomain });

    await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });
    // Visitor-conversion prompt must never appear on auth routes.
    await expect(page.locator(NO_VISITOR_PROMPT)).toHaveCount(0);

    // Count signup requests so we can prove double-submit is prevented.
    let signupRequests = 0;
    page.on('request', (req) => {
      if (req.url().includes(`${isolatedHost}/auth/v1/signup`)) signupRequests += 1;
    });

    await page.getByLabel('Display name').fill('WS14 Primary User');
    await page.getByLabel('Profile URL').fill(slug);
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.locator('#password').fill(env.testPassword);

    const submit = page.getByRole('button', { name: /Create account/i });
    // Two synchronous clicks: the second lands while the first submission is
    // pending, so the submit lock must swallow it (double-submit prevention).
    await submit.evaluate((el) => {
      (el as HTMLButtonElement).click();
      (el as HTMLButtonElement).click();
    });

    // Provisioning (trigger) creates tenant + membership + profile.
    const profile = await waitForProvisionedProfile(admin, slug);
    const userId = profile.owner_user_id;
    registerUserFixtures(registry, userId, profile);

    expect(signupRequests).toBe(1); // double submission prevented

    // Chosen slug persisted; truthful empty defaults.
    expect(profile.slug).toBe(slug);
    expect(profile.display_name).toBe('WS14 Primary User');
    expect(profile.is_public).toBe(false);

    // Membership row created with owner role.
    const { data: memberships, error: mErr } = await admin
      .from('tenant_memberships')
      .select('role, user_id, tenant_id')
      .eq('user_id', userId);
    expect(mErr).toBeNull();
    expect(memberships?.length).toBe(1);
    expect(memberships?.[0].role).toBe('owner');
    expect(memberships?.[0].tenant_id).toBe(profile.tenant_id);

    // No global-admin metadata assigned to an ordinary signup.
    const authUser = await getAuthUser(admin, userId);
    const appMeta = (authUser?.app_metadata ?? {}) as Record<string, unknown>;
    for (const key of ['is_global_admin', 'global_admin', 'is_admin', 'admin']) {
      expect(appMeta[key]).toBeFalsy();
    }
    expect(String(appMeta.role ?? '')).not.toBe('admin');
    expect((authUser?.user_metadata as Record<string, unknown>)?.slug).toBe(slug);

    // Email-confirmation configuration (recorded for the report + later steps).
    const confirmed = await isEmailConfirmed(admin, userId);
    confirmationRequired = !confirmed;
    if (confirmationRequired) {
      // Test setup only — NOT a user-facing email verification.
      await adminConfirmEmail(admin, userId);
    }

    primary = {
      id: userId,
      email,
      slug,
      password: env.testPassword,
      profileId: profile.id,
      tenantId: profile.tenant_id,
    };
  });

  test('confirmed user signs in, reaches a scoped dashboard, and sees no demo data', async ({ page }) => {
    await signInViaUI(page, { email: primary.email, password: primary.password });
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    // Dashboard belongs to this disposable user.
    await expect(page.getByText('WS14 Primary User').first()).toBeVisible();
    // No Alex Chen demo data in a real authenticated dashboard.
    await expect(page.getByText(/Alex Chen/i)).toHaveCount(0);
    // No token/secret ever leaks into the URL.
    expect(page.url()).not.toMatch(/access_token|refresh_token|code=/);
  });

  test('invalid slug is rejected client-side without creating a user', async ({ page, admin }) => {
    await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });
    let signupRequests = 0;
    page.on('request', (req) => {
      if (req.url().includes(`${isolatedHost}/auth/v1/signup`)) signupRequests += 1;
    });
    await page.getByLabel('Display name').fill('Bad Slug User');
    // Force an invalid slug (leading dash) past the auto-derive.
    await page.getByLabel('Profile URL').fill('-invalid-');
    await page.getByLabel('Email', { exact: true }).fill('bad-slug@codecard-e2e.example.com');
    await page.locator('#password').fill('ValidPass123!');
    await page.getByRole('button', { name: /Create account/i }).click();

    // A field-level validation error is shown and no signup request is made.
    await expect(page.locator('#slug')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#slug-error')).toBeVisible();
    expect(signupRequests).toBe(0);

    const { data } = await admin.from('profiles').select('id').eq('slug', '-invalid-').maybeSingle();
    expect(data).toBeNull();
  });

  test('sign-out invalidates the session and blocks the dashboard', async ({ page }) => {
    await signInViaUI(page, { email: primary.email, password: primary.password });
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    await signOutViaUI(page);

    // Protected route boundary must actually reject the cleared session.
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
    // No protected content or token flashes.
    await expect(page.getByText(/Alex Chen/i)).toHaveCount(0);
    expect(page.url()).not.toMatch(/access_token|refresh_token|code=/);
    // Visitor-conversion prompt must not appear on sign-in.
    await expect(page.locator(NO_VISITOR_PROMPT)).toHaveCount(0);
  });

  test('wrong password fails safely; correct works; session survives reload', async ({ page }) => {
    await page.context().clearCookies();
    await signInViaUI(page, { email: primary.email, password: 'WrongPassword123!' });
    const alert = page.getByRole('alert').first();
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText(/access_token|refresh_token|code=|supabase|400|401/i);
    await expect(page).toHaveURL(/\/sign-in/);

    // Correct password now works.
    await page.getByLabel('Email', { exact: true }).fill(primary.email);
    await page.locator('#password').fill(primary.password);
    await page.getByRole('button', { name: /^Sign in$/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    // Full reload preserves the session.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('WS14 Primary User').first()).toBeVisible();
  });

  test('a second (admin-created) user session stays isolated from the first', async ({
    page,
    admin,
    env,
    run,
    registry,
  }) => {
    const second = await createAdminUser(admin, env, registry, {
      slug: `ws14-second-${run.runUuid.slice(0, 8)}`,
      displayName: 'WS14 Second User',
    });

    await page.context().clearCookies();
    await signInViaUI(page, { email: second.email, password: second.password });
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    // Second user sees only their own profile — never the first user's or demo data.
    await expect(page.getByText('WS14 Second User').first()).toBeVisible();
    await expect(page.getByText('WS14 Primary User')).toHaveCount(0);
    await expect(page.getByText(/Alex Chen/i)).toHaveCount(0);

    await signOutViaUI(page);
    // Signing out user two must not restore user one.
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });

  test('safe internal redirects are honored and unsafe redirects are refused', async ({ page }) => {
    const cases: { redirect: string; safe: boolean }[] = [
      { redirect: '/dashboard/projects', safe: true },
      { redirect: 'https://attacker.example', safe: false },
      { redirect: '//attacker.example', safe: false },
      { redirect: 'javascript:alert(1)', safe: false },
      { redirect: 'https:%2f%2fattacker.example', safe: false },
    ];

    for (const { redirect, safe } of cases) {
      await page.context().clearCookies();
      await signInViaUI(page, { email: primary.email, password: primary.password }, { redirect });
      await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
      const url = new URL(page.url());
      expect(url.hostname).toBe('localhost');
      expect(url.href).not.toContain('attacker.example');
      if (safe) {
        expect(url.pathname).toBe('/dashboard/projects');
      } else {
        expect(url.pathname).toBe('/dashboard'); // fell back to the safe default
      }
    }

    // Auth callback rejects unsafe destinations and never loops.
    await page.context().clearCookies();
    await page.goto('/auth/callback?redirect=https://attacker.example', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/auth\/error/, { timeout: 15_000 });
    expect(page.url()).not.toContain('attacker.example');
  });

  test('forgot-password: linked, generic response for any email, safe redirect target', async ({ page }) => {
    // Linked from sign-in.
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    const forgotLink = page.getByRole('link', { name: /Forgot password/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.locator(NO_VISITOR_PROMPT)).toHaveCount(0);

    // Capture the reset request to assert the redirectTo target is a real,
    // non-production, local CodeCard reset route.
    const recoverRequest = page.waitForRequest(
      (req) => req.url().includes(`${isolatedHost}/auth/v1/recover`),
      { timeout: 20_000 },
    );
    await page.getByLabel('Email').fill(primary.email);
    await page.getByRole('button', { name: /Send reset link/i }).click();
    const req = await recoverRequest;
    const body = (req.postDataJSON?.() ?? {}) as Record<string, unknown>;
    const redirectTo = decodeURIComponent(
      new URL(req.url()).searchParams.get('redirect_to') ??
        String(body.redirect_to ?? body.redirectTo ?? ''),
    );
    expect(redirectTo).toContain('localhost');
    expect(redirectTo).not.toContain(PRODUCTION_SUPABASE_PROJECT_REF);
    expect(redirectTo).toContain('/reset-password');

    // Generic public response for an existing account; must not reveal existence
    // or expose raw provider errors. (A rate-limited send surfaces the same
    // generic error shape and reveals nothing.)
    const existingStatus = page.locator('[role="status"], [role="alert"]').first();
    await expect(existingStatus).toContainText(/if an account exists|something went wrong/i, {
      timeout: 20_000,
    });
    expect(await existingStatus.innerText()).not.toMatch(
      /supabase|gotrue|rate ?limit|429|not found|no user/i,
    );

    // A nonexistent email yields the same public-facing response shape.
    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(`missing-${Date.now()}@codecard-e2e.example.com`);
    await page.getByRole('button', { name: /Send reset link/i }).click();
    const missingStatus = page.locator('[role="status"], [role="alert"]').first();
    await expect(missingStatus).toContainText(/if an account exists|something went wrong/i, {
      timeout: 20_000,
    });
    expect(await missingStatus.innerText()).not.toMatch(
      /supabase|gotrue|rate ?limit|429|not found|no user/i,
    );
  });

  test('reset-password route rejects a missing recovery session safely', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/reset-password', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Reset link unavailable/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('link', { name: /Request new link/i })).toBeVisible();
    // No recovery token leaks into the URL.
    expect(page.url()).not.toMatch(/token|access_token|type=recovery/);
  });

  test('full password reset: real UI request → Mailtrap email → recovery link → new password', async ({
    page,
    run,
  }) => {
    const mailtrap = loadMailtrapConfig();
    test.skip(!mailtrap, 'Mailtrap sandbox credentials not configured in .env.e2e.local');
    if (!mailtrap) return;

    const NEW_PASSWORD = 'Rotated-E2E-Password-NotForProduction-7b2c';

    // Start clean: drop any earlier captured messages for this run's recipient
    // so the next captured message is unambiguously the one we request now.
    await cleanupRunMessages(mailtrap, run.runId);

    // 1. Request the reset through the real UI in the same browser context the
    //    user would use (the PKCE verifier lives in this context's cookies).
    //    GoTrue rate-limits recovery emails per address (the previous test just
    //    requested one for this account), so retry until the send is accepted.
    await page.context().clearCookies();
    const requestDeadline = Date.now() + 180_000;
    for (;;) {
      await page.goto('/forgot-password', { waitUntil: 'networkidle' });
      const emailInput = page.getByLabel('Email');
      await emailInput.fill(primary.email);
      // Guard against the hydration race resetting the controlled input.
      await expect(emailInput).toHaveValue(primary.email);
      await page.getByRole('button', { name: /Send reset link/i }).click();
      const outcome = page.locator('[role="status"], [role="alert"]').first();
      await expect(outcome).toContainText(
        /if an account exists|something went wrong|valid email/i,
        { timeout: 20_000 },
      );
      const text = await outcome.innerText();
      if (/if an account exists/i.test(text)) break;
      if (Date.now() > requestDeadline) {
        throw new Error('Reset request kept failing (rate limit did not clear in time)');
      }
      // Either the per-email send rate limit is active or hydration swallowed
      // the input — wait it out and retry through the real UI.
      await new Promise((r) => setTimeout(r, 20_000));
    }

    // 2. The reset email arrives in the isolated Mailtrap sandbox inbox.
    const message = await waitForMessageTo(mailtrap, primary.email, {
      subjectPattern: /reset/i,
      timeoutMs: 90_000,
    });
    expect(message.subject).toMatch(/reset/i);

    // 3. Extract the real recovery link (never logged) and open it. It must
    //    round-trip through the isolated GoTrue verify endpoint and land on the
    //    real CodeCard /auth/callback → /reset-password.
    const recoveryLink = await extractFirstLink(mailtrap, message.id);
    expect(new URL(recoveryLink).host.toLowerCase()).toBe(isolatedHost);
    await page.goto(recoveryLink, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/reset-password/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /Set a new password/i })).toBeVisible({
      timeout: 20_000,
    });
    // No recovery token persists in the final app URL.
    expect(page.url()).not.toMatch(/token|code=|type=recovery/);

    // 4a. Weak password is rejected by policy through the real UI.
    const formAlert = page.locator('form').getByRole('alert');
    await page.getByLabel('New password').fill('weakpass');
    await page.getByLabel('Confirm password').fill('weakpass');
    await page.getByRole('button', { name: /Update password/i }).click();
    await expect(formAlert).toContainText(/uppercase|number|characters/i);

    // 4b. Confirmation mismatch is rejected.
    await page.getByLabel('New password').fill(NEW_PASSWORD);
    await page.getByLabel('Confirm password').fill(`${NEW_PASSWORD}-x`);
    await page.getByRole('button', { name: /Update password/i }).click();
    await expect(formAlert).toContainText(/do not match/i);

    // 4c. Valid update succeeds and returns to sign-in with the success notice.
    await page.getByLabel('New password').fill(NEW_PASSWORD);
    await page.getByLabel('Confirm password').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: /Update password/i }).click();
    await page.waitForURL(/\/sign-in\?reset=success/, { timeout: 30_000 });
    await expect(page.getByText(/password was updated/i)).toBeVisible();

    // 5. The old password is rejected with a safe generic error.
    await signInViaUI(page, { email: primary.email, password: primary.password });
    const alert = page.getByRole('alert').first();
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText(/supabase|gotrue|400|401/i);
    await expect(page).toHaveURL(/\/sign-in/);

    // 6. The new password signs in and reaches the dashboard.
    await page.getByLabel('Email', { exact: true }).fill(primary.email);
    await page.locator('#password').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: /^Sign in$/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByText('WS14 Primary User').first()).toBeVisible();

    // Keep the shared fixture usable for any later test.
    primary = { ...primary, password: NEW_PASSWORD };

    // 7. Delete the captured reset message (user cleanup happens in teardown).
    await deleteMessage(mailtrap, message.id);
  });

  test('visitor-conversion prompt never appears on any auth route', async ({ page }) => {
    for (const route of ['/sign-in', '/sign-up', '/forgot-password', '/reset-password']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(NO_VISITOR_PROMPT)).toHaveCount(0);
    }
  });

  test('auth routes have no horizontal overflow at mobile widths', async ({ page }) => {
    const widths = [375, 390, 414, 430];
    for (const route of ['/sign-in', '/sign-up', '/forgot-password']) {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `${route} @ ${width}px`).toBeLessThanOrEqual(1);
        await expect(page.getByRole('button').first()).toBeVisible();
      }
    }
  });
});
