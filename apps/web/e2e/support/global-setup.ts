import { loadIsolatedE2EEnv, isolatedSupabaseHost, PRODUCTION_SUPABASE_HOST } from './isolated-e2e';

/**
 * Fail-closed guard executed before the webServer builds/starts. If the
 * isolated environment is missing or (impossibly) resolves to production the
 * entire run aborts before any browser can touch a backend.
 */
export default async function globalSetup() {
  const env = loadIsolatedE2EEnv();
  const host = isolatedSupabaseHost(env);
  if (host === PRODUCTION_SUPABASE_HOST) {
    throw new Error('Isolated E2E env resolved to the production Supabase host — aborting.');
  }
  // Redacted confirmation only: project ref prefix, never keys.
  const refPrefix = env.projectRef.slice(0, 4);
  // eslint-disable-next-line no-console
  console.log(`[WS14-T002] Isolated E2E backend confirmed: ${refPrefix}… (production rejected).`);
}
