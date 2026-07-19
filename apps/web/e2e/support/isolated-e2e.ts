import path from 'node:path';
import {
  validateE2EEnvironment,
  PRODUCTION_SUPABASE_PROJECT_REF,
  PRODUCTION_SUPABASE_URL,
  type ValidatedE2EEnv,
} from '../../src/lib/e2e/env-guard';
import { loadE2EEnvFile } from '../../src/lib/e2e/load-e2e-env';

/**
 * Isolated real-backend E2E wiring for Playwright (WS14-T002).
 *
 * The browser Supabase client bakes NEXT_PUBLIC_SUPABASE_URL / publishable key
 * at BUILD time. So the ONLY safe way to run real authentication flows through
 * the real UI against the isolated E2E project is to build + serve the app with
 * those public variables mapped from the git-ignored `.env.e2e.local` file.
 *
 * This module is the single source of truth for that mapping and for the
 * production-abort guard. It never prints secret values.
 */

export const E2E_PORT = Number(process.env.PLAYWRIGHT_E2E_PORT ?? '3100');
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

export { PRODUCTION_SUPABASE_PROJECT_REF, PRODUCTION_SUPABASE_URL };

function e2eEnvFilePath(): string {
  // apps/web/e2e/support -> apps/web/.env.e2e.local
  return path.resolve(__dirname, '..', '..', '.env.e2e.local');
}

/**
 * Load + validate the isolated E2E environment. Throws (fail-closed) unless the
 * target is a well-formed, non-production, destructive-enabled isolated project.
 */
export function loadIsolatedE2EEnv(): ValidatedE2EEnv {
  const fileValues = loadE2EEnvFile(e2eEnvFilePath());
  const result = validateE2EEnvironment(fileValues);
  if (!result.ok) {
    throw new Error(
      `Isolated E2E environment is not usable. Failed checks: ${result.failures.join(', ')}. ` +
        'Real authentication E2E is refused unless the isolated project is configured.',
    );
  }
  return result.env;
}

/** Host (no scheme) of the isolated Supabase project, e.g. `zbum….supabase.co`. */
export function isolatedSupabaseHost(env: ValidatedE2EEnv): string {
  return new URL(env.supabaseUrl).host.toLowerCase();
}

export const PRODUCTION_SUPABASE_HOST = `${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`;

/**
 * Assert a network URL never targets the production Supabase project. Used as a
 * runtime tripwire during browser tests so a misbuilt bundle can never mutate
 * production even if the build guard were somehow bypassed.
 */
export function assertNotProductionUrl(url: string): void {
  let host: string;
  try {
    host = new URL(url).host.toLowerCase();
  } catch {
    return;
  }
  if (host === PRODUCTION_SUPABASE_HOST) {
    throw new Error(
      'PRODUCTION SUPABASE CONTACT DETECTED during E2E — aborting. ' +
        'The served app is not pointed at the isolated project.',
    );
  }
}

/**
 * Environment variables handed to the Playwright webServer so `next build` bakes
 * the isolated project into the browser bundle and the server runtime uses the
 * isolated backend. Only browser-safe public keys and the isolated service-role
 * key (server-only, never in the client bundle) are exported here.
 */
export function webServerEnv(env: ValidatedE2EEnv): Record<string, string> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: env.supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.publishableKey,
    NEXT_PUBLIC_APP_URL: E2E_BASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.serviceRoleKey,
    // Real backend mode — NOT the local UI fixture mode (CODECARD_E2E_FIXTURES).
    // Marks the server runtime as isolated E2E so Redis-less strict rate
    // limits don't fail closed against the production build served locally.
    CODECARD_E2E: '1',
    NODE_ENV: 'production',
  };
}
