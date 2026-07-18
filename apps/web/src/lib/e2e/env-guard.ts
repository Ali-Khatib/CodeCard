/**
 * WS14 isolated E2E environment guard.
 *
 * Every real-backend E2E operation (disposable user creation, service-role
 * calls, storage mutation, destructive cleanup, browser startup that can
 * mutate data) must call `requireE2EEnvironment()` first. The guard fails
 * closed: unless every check below passes it throws and nothing may proceed.
 *
 * There is intentionally NO bypass flag. Do not add one.
 */

/** The live production project. Forbidden for E2E in any form. */
export const PRODUCTION_SUPABASE_PROJECT_REF = 'gclteunkzorwaliwhatp';
export const PRODUCTION_SUPABASE_URL = `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`;

export const E2E_REFUSAL_MESSAGE =
  'Refusing to run CodeCard E2E against a non-isolated Supabase environment.';

/** Default disposable-mailbox domain (RFC 2606 reserved, never deliverable). */
export const DEFAULT_E2E_EMAIL_DOMAIN = 'codecard-e2e.example.com';

export const REQUIRED_E2E_VARS = [
  'CODECARD_E2E',
  'CODECARD_E2E_ALLOW_DESTRUCTIVE',
  'CODECARD_E2E_SUPABASE_URL',
  'CODECARD_E2E_SUPABASE_PUBLISHABLE_KEY',
  'CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY',
  'CODECARD_E2E_SUPABASE_PROJECT_REF',
  'CODECARD_E2E_TEST_PASSWORD',
  'CODECARD_E2E_BASE_URL',
] as const;

export type E2EEnvSource = Record<string, string | undefined>;

export type ValidatedE2EEnv = {
  supabaseUrl: string;
  publishableKey: string;
  serviceRoleKey: string;
  projectRef: string;
  testPassword: string;
  baseUrl: string;
  emailDomain: string;
  /** Always true when validation passes (check 12 is mandatory). */
  destructiveAllowed: true;
  /** Present only when test-mode Stripe credentials were supplied. */
  stripe: {
    secretKey: string;
    webhookSecret: string | null;
    priceId: string | null;
  } | null;
};

export type E2EValidationResult =
  | { ok: true; env: ValidatedE2EEnv }
  | { ok: false; failures: string[] };

function hostFor(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Validate an environment source against every isolation requirement.
 * Failure entries are stable machine-readable names — never secret values.
 */
export function validateE2EEnvironment(source: E2EEnvSource): E2EValidationResult {
  const failures: string[] = [];

  // 1. E2E mode must be explicitly requested. The local UI fixture mode
  //    (CODECARD_E2E_FIXTURES=1) is NOT real E2E mode and does not count.
  if (source.CODECARD_E2E !== '1') {
    failures.push('e2e_mode_not_requested');
  }

  // 12. Destructive operations must be explicitly enabled for the isolated env.
  if (source.CODECARD_E2E_ALLOW_DESTRUCTIVE !== '1') {
    failures.push('destructive_operations_not_enabled');
  }

  // 2. Required variables must exist.
  for (const name of REQUIRED_E2E_VARS) {
    if (name === 'CODECARD_E2E' || name === 'CODECARD_E2E_ALLOW_DESTRUCTIVE') continue;
    if (!source[name]?.trim()) {
      failures.push(`missing:${name}`);
    }
  }

  const supabaseUrl = source.CODECARD_E2E_SUPABASE_URL?.trim() ?? '';
  const projectRef = source.CODECARD_E2E_SUPABASE_PROJECT_REF?.trim() ?? '';
  const baseUrl = source.CODECARD_E2E_BASE_URL?.trim() ?? '';

  // 3. Supabase URL must be valid HTTPS.
  if (supabaseUrl) {
    let parsed: URL | null = null;
    try {
      parsed = new URL(supabaseUrl);
    } catch {
      failures.push('supabase_url_invalid');
    }
    if (parsed && parsed.protocol !== 'https:') {
      failures.push('supabase_url_not_https');
    }
  }

  // 4. Project reference must be present and well-formed.
  if (projectRef && !/^[a-z0-9]{20}$/.test(projectRef)) {
    failures.push('project_ref_malformed');
  }

  // 6. The production project reference is forbidden.
  if (projectRef === PRODUCTION_SUPABASE_PROJECT_REF) {
    failures.push('production_project_ref_forbidden');
  }

  const supabaseHost = supabaseUrl ? hostFor(supabaseUrl) : null;

  // 7. The production Supabase URL is forbidden.
  if (supabaseHost && supabaseHost === `${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`) {
    failures.push('production_supabase_url_forbidden');
  }

  // 5. URL and project reference must correspond.
  if (
    supabaseHost &&
    projectRef &&
    /^[a-z0-9]{20}$/.test(projectRef) &&
    supabaseHost !== `${projectRef}.supabase.co`
  ) {
    failures.push('url_project_ref_mismatch');
  }

  // 8. The E2E Supabase URL must differ from the ordinary runtime URL.
  const runtimeUrl = source.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (runtimeUrl && supabaseHost && hostFor(runtimeUrl) === supabaseHost) {
    failures.push('matches_runtime_supabase_url');
  }

  // 10. Stripe credentials, when supplied, must be test-mode.
  const stripeSecret = source.CODECARD_E2E_STRIPE_SECRET_KEY?.trim();
  if (stripeSecret && !/^(sk|rk)_test_/.test(stripeSecret)) {
    failures.push('stripe_key_not_test_mode');
  }

  // 11. The application base URL must be non-production (local only).
  if (baseUrl) {
    const baseHost = hostFor(baseUrl);
    const hostname = baseHost?.split(':')[0] ?? '';
    if (!baseHost) {
      failures.push('base_url_invalid');
    } else if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
      failures.push('base_url_not_local');
    }
  }

  // Disposable-mailbox domain must be a reserved/non-deliverable domain.
  const emailDomain =
    source.CODECARD_E2E_EMAIL_DOMAIN?.trim().toLowerCase() || DEFAULT_E2E_EMAIL_DOMAIN;
  const domainIsSafe =
    emailDomain === 'example.com' ||
    emailDomain.endsWith('.example.com') ||
    emailDomain.endsWith('.test') ||
    emailDomain.endsWith('.invalid') ||
    emailDomain.endsWith('.example');
  if (!domainIsSafe) {
    failures.push('email_domain_not_safe');
  }

  if (failures.length > 0) {
    return { ok: false, failures };
  }

  return {
    ok: true,
    env: {
      supabaseUrl,
      publishableKey: source.CODECARD_E2E_SUPABASE_PUBLISHABLE_KEY!.trim(),
      serviceRoleKey: source.CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY!.trim(),
      projectRef,
      testPassword: source.CODECARD_E2E_TEST_PASSWORD!.trim(),
      baseUrl,
      emailDomain,
      destructiveAllowed: true,
      stripe: stripeSecret
        ? {
            secretKey: stripeSecret,
            webhookSecret: source.CODECARD_E2E_STRIPE_WEBHOOK_SECRET?.trim() || null,
            priceId: source.CODECARD_E2E_STRIPE_PRICE_ID?.trim() || null,
          }
        : null,
    },
  };
}

/**
 * Assert the environment is a safe isolated E2E target, or throw loudly.
 * The error names failed checks only — never variable values.
 */
export function requireE2EEnvironment(source: E2EEnvSource = process.env): ValidatedE2EEnv {
  const result = validateE2EEnvironment(source);
  if (!result.ok) {
    throw new Error(`${E2E_REFUSAL_MESSAGE} Failed checks: ${result.failures.join(', ')}`);
  }
  return result.env;
}
