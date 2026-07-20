/**
 * WS14-T020 — Environment guard for the local development seed script.
 *
 * Pure validation only (no I/O, no secrets in return values).
 * Failures are machine-readable names — never env values.
 */

export const PRODUCTION_SUPABASE_PROJECT_REF = 'gclteunkzorwaliwhatp';
export const PRODUCTION_SUPABASE_URL = `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`;

/** Staging MVP project — only allowed when explicitly opted in. */
export const STAGING_SUPABASE_PROJECT_REF = 'zbumnudyvclkmynpqjsr';

export const LOCAL_SEED_REFUSAL =
  'Refusing to run CodeCard local seed against a forbidden or unapproved Supabase target.';

/** Deterministic local sample identity — never the staging showcase slug/email. */
export const LOCAL_SEED_EMAIL = 'local.dev@codecard.local.test';
/** Must not collide with app routes (`/demo` is reserved) or the staging showcase. */
export const LOCAL_SEED_SLUG = 'local-dev';
export const LOCAL_SEED_DISPLAY_NAME = 'Local Dev Sample';

export type SeedEnvSource = Record<string, string | undefined>;

export type ValidatedSeedEnv = {
  supabaseUrl: string;
  serviceRoleKey: string;
  publishableKey: string | null;
  projectRef: string | null;
  password: string;
  target: 'local' | 'staging';
};

export type SeedValidationResult =
  | { ok: true; env: ValidatedSeedEnv }
  | { ok: false; failures: string[] };

function hostFor(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

function isLocalSupabaseHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(':')[0] ?? '';
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]';
}

/**
 * Validate seed target. Requires deliberate opt-in and never permits production.
 */
export function validateLocalSeedEnvironment(source: SeedEnvSource): SeedValidationResult {
  const failures: string[] = [];

  if (source.CODECARD_LOCAL_SEED !== '1') {
    failures.push('local_seed_not_requested');
  }

  const supabaseUrl = source.CODECARD_LOCAL_SEED_SUPABASE_URL?.trim()
    || source.NEXT_PUBLIC_SUPABASE_URL?.trim()
    || '';
  const serviceRoleKey = source.CODECARD_LOCAL_SEED_SERVICE_ROLE_KEY?.trim()
    || source.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || '';
  const publishableKey = source.CODECARD_LOCAL_SEED_PUBLISHABLE_KEY?.trim()
    || source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    || source.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    || null;
  const password = source.CODECARD_LOCAL_SEED_PASSWORD?.trim() || '';
  const projectRef = source.CODECARD_LOCAL_SEED_PROJECT_REF?.trim()
    || source.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim()
    || null;
  const allowStaging = source.CODECARD_LOCAL_SEED_ALLOW_STAGING === '1';

  if (!supabaseUrl) failures.push('missing:supabase_url');
  if (!serviceRoleKey) failures.push('missing:service_role_key');
  if (!password) failures.push('missing:CODECARD_LOCAL_SEED_PASSWORD');
  if (password && password.length < 12) failures.push('password_too_short');

  const host = supabaseUrl ? hostFor(supabaseUrl) : null;

  if (supabaseUrl && !host) {
    failures.push('supabase_url_invalid');
  }

  // Production is always forbidden — URL and ref.
  if (host === `${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`) {
    failures.push('production_supabase_url_forbidden');
  }
  if (projectRef === PRODUCTION_SUPABASE_PROJECT_REF) {
    failures.push('production_project_ref_forbidden');
  }
  if (supabaseUrl.toLowerCase().includes(PRODUCTION_SUPABASE_PROJECT_REF)) {
    failures.push('production_supabase_url_forbidden');
  }

  let target: 'local' | 'staging' | null = null;

  if (host && isLocalSupabaseHost(host)) {
    // Local Supabase CLI stack (api port 54321 by convention).
    try {
      const port = new URL(supabaseUrl).port || (new URL(supabaseUrl).protocol === 'https:' ? '443' : '80');
      if (port !== '54321' && port !== '80' && port !== '443') {
        // Still allow other local ports used by alternate stacks.
      }
      target = 'local';
    } catch {
      failures.push('supabase_url_invalid');
    }
  } else if (host === `${STAGING_SUPABASE_PROJECT_REF}.supabase.co`) {
    if (!allowStaging) {
      failures.push('staging_requires_explicit_allow');
    } else if (projectRef && projectRef !== STAGING_SUPABASE_PROJECT_REF) {
      failures.push('url_project_ref_mismatch');
    } else {
      target = 'staging';
    }
  } else if (host) {
    failures.push('unknown_remote_target_forbidden');
  }

  if (projectRef && !/^[a-z0-9]{20}$/.test(projectRef) && target !== 'local') {
    // Local stacks may omit a 20-char cloud ref.
    if (target === 'staging') {
      failures.push('project_ref_malformed');
    }
  }

  if (
    target === 'staging'
    && projectRef
    && projectRef !== STAGING_SUPABASE_PROJECT_REF
  ) {
    failures.push('url_project_ref_mismatch');
  }

  if (failures.length > 0 || !target) {
    if (!target && failures.length === 0) failures.push('target_unresolved');
    return { ok: false, failures };
  }

  return {
    ok: true,
    env: {
      supabaseUrl,
      serviceRoleKey,
      publishableKey,
      projectRef,
      password,
      target,
    },
  };
}

export function requireLocalSeedEnvironment(source: SeedEnvSource = process.env): ValidatedSeedEnv {
  const result = validateLocalSeedEnvironment(source);
  if (!result.ok) {
    throw new Error(`${LOCAL_SEED_REFUSAL} Failed checks: ${result.failures.join(', ')}`);
  }
  return result.env;
}
