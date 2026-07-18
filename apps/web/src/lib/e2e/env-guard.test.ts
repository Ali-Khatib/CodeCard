import { describe, expect, it } from 'vitest';
import {
  DEFAULT_E2E_EMAIL_DOMAIN,
  E2E_REFUSAL_MESSAGE,
  PRODUCTION_SUPABASE_PROJECT_REF,
  PRODUCTION_SUPABASE_URL,
  requireE2EEnvironment,
  validateE2EEnvironment,
  type E2EEnvSource,
} from './env-guard';

const ISOLATED_REF = 'zbumnudyvclkmynpqjsr';

function baseIsolated(overrides: E2EEnvSource = {}): E2EEnvSource {
  return {
    CODECARD_E2E: '1',
    CODECARD_E2E_ALLOW_DESTRUCTIVE: '1',
    CODECARD_E2E_SUPABASE_URL: `https://${ISOLATED_REF}.supabase.co`,
    CODECARD_E2E_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_e2e_placeholder',
    CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY: 'service_role_e2e_placeholder',
    CODECARD_E2E_SUPABASE_PROJECT_REF: ISOLATED_REF,
    CODECARD_E2E_TEST_PASSWORD: 'Disposable-E2E-Password-NotReal',
    CODECARD_E2E_BASE_URL: 'http://127.0.0.1:3000',
    CODECARD_E2E_EMAIL_DOMAIN: DEFAULT_E2E_EMAIL_DOMAIN,
    ...overrides,
  };
}

describe('WS14 E2E environment guard', () => {
  it('1. missing E2E variables fail closed', () => {
    const result = validateE2EEnvironment({ CODECARD_E2E: '1' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toContain('missing:CODECARD_E2E_SUPABASE_URL');
    expect(result.failures).toContain('missing:CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY');
    expect(result.failures).toContain('destructive_operations_not_enabled');
  });

  it('2. production project reference is rejected', () => {
    const result = validateE2EEnvironment(
      baseIsolated({
        CODECARD_E2E_SUPABASE_PROJECT_REF: PRODUCTION_SUPABASE_PROJECT_REF,
        CODECARD_E2E_SUPABASE_URL: PRODUCTION_SUPABASE_URL,
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toContain('production_project_ref_forbidden');
  });

  it('3. production Supabase URL is rejected', () => {
    const result = validateE2EEnvironment(
      baseIsolated({ CODECARD_E2E_SUPABASE_URL: PRODUCTION_SUPABASE_URL }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toContain('production_supabase_url_forbidden');
  });

  it('4. runtime and E2E Supabase URLs cannot match', () => {
    const result = validateE2EEnvironment(
      baseIsolated({
        NEXT_PUBLIC_SUPABASE_URL: `https://${ISOLATED_REF}.supabase.co`,
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toContain('matches_runtime_supabase_url');
  });

  it('5. invalid URL is rejected', () => {
    const result = validateE2EEnvironment(
      baseIsolated({ CODECARD_E2E_SUPABASE_URL: 'not-a-url' }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toContain('supabase_url_invalid');
  });

  it('6. missing project reference is rejected', () => {
    const result = validateE2EEnvironment(
      baseIsolated({ CODECARD_E2E_SUPABASE_PROJECT_REF: '' }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toContain('missing:CODECARD_E2E_SUPABASE_PROJECT_REF');
  });

  it('7. URL/project-reference mismatch is rejected', () => {
    const result = validateE2EEnvironment(
      baseIsolated({
        CODECARD_E2E_SUPABASE_URL: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co',
        CODECARD_E2E_SUPABASE_PROJECT_REF: ISOLATED_REF,
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toContain('url_project_ref_mismatch');
  });

  it('10. live Stripe key is rejected', () => {
    const result = validateE2EEnvironment(
      baseIsolated({ CODECARD_E2E_STRIPE_SECRET_KEY: 'sk_live_not_allowed' }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toContain('stripe_key_not_test_mode');
  });

  it('11. test-mode Stripe key is accepted when present', () => {
    const result = validateE2EEnvironment(
      baseIsolated({ CODECARD_E2E_STRIPE_SECRET_KEY: 'sk_test_placeholder' }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.env.stripe?.secretKey.startsWith('sk_test_')).toBe(true);
  });

  it('12. missing optional Stripe values remain valid', () => {
    const result = validateE2EEnvironment(baseIsolated());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.env.stripe).toBeNull();
  });

  it('13. production application URL is rejected', () => {
    const result = validateE2EEnvironment(
      baseIsolated({ CODECARD_E2E_BASE_URL: 'https://codecard.app' }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toContain('base_url_not_local');
  });

  it('14. explicit isolated environment is accepted', () => {
    const env = requireE2EEnvironment(baseIsolated());
    expect(env.projectRef).toBe(ISOLATED_REF);
    expect(env.destructiveAllowed).toBe(true);
  });

  it('throws the loud refusal message and never includes secret values', () => {
    expect(() => requireE2EEnvironment(baseIsolated({ CODECARD_E2E: '0' }))).toThrowError(
      E2E_REFUSAL_MESSAGE,
    );
    try {
      requireE2EEnvironment(
        baseIsolated({ CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY: 'super-secret-value-xyz' }),
      );
    } catch (error) {
      expect(String(error)).not.toContain('super-secret-value-xyz');
    }
  });

  it('24. mock UI fixture mode is distinguishable from real E2E mode', () => {
    // CODECARD_E2E_FIXTURES=1 alone is NOT enough: the guard requires CODECARD_E2E=1.
    const result = validateE2EEnvironment({
      CODECARD_E2E_FIXTURES: '1',
      ...baseIsolated({ CODECARD_E2E: undefined }),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toContain('e2e_mode_not_requested');
  });
});
