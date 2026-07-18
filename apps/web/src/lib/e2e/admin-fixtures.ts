import 'server-only';

/**
 * Server-only administrative fixtures for the isolated WS14 E2E backend.
 *
 * This module holds the ONLY place test code may touch the E2E service-role
 * credential. It must never be imported by client components, app routes, or
 * anything reachable from the Next.js client bundle (enforced by
 * e2e-isolation.contract.test.ts). It deliberately does NOT reuse the
 * production runtime Supabase clients in lib/supabase.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireE2EEnvironment, type ValidatedE2EEnv } from './env-guard';
import { assertAllowedFixtureIdentity, disposableFixtureEmail } from './run-id';
import type { E2EFixtureRegistry } from './fixture-registry';

/**
 * Administrative client for the ISOLATED E2E project. The guard runs (again)
 * inside so a client can never be constructed for a non-isolated target,
 * even if a caller passes a hand-built env object.
 */
export function createE2EAdminClient(env?: ValidatedE2EEnv): SupabaseClient {
  const validated = env ?? requireE2EEnvironment();
  // Re-validate defensively when an env object was supplied by the caller.
  requireE2EEnvironment({
    CODECARD_E2E: '1',
    CODECARD_E2E_ALLOW_DESTRUCTIVE: '1',
    CODECARD_E2E_SUPABASE_URL: validated.supabaseUrl,
    CODECARD_E2E_SUPABASE_PUBLISHABLE_KEY: validated.publishableKey,
    CODECARD_E2E_SUPABASE_SERVICE_ROLE_KEY: validated.serviceRoleKey,
    CODECARD_E2E_SUPABASE_PROJECT_REF: validated.projectRef,
    CODECARD_E2E_TEST_PASSWORD: validated.testPassword,
    CODECARD_E2E_BASE_URL: validated.baseUrl,
  });

  return createClient(validated.supabaseUrl, validated.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anonymous-key client for read-only RLS spot checks against the E2E project. */
export function createE2EAnonClient(env?: ValidatedE2EEnv): SupabaseClient {
  const validated = env ?? requireE2EEnvironment();
  return createClient(validated.supabaseUrl, validated.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type DisposableUser = {
  id: string;
  email: string;
};

/**
 * Create one disposable Auth user administratively (setup for tests whose
 * subject is not sign-up; the WS14-T002 sign-up test must use the real UI).
 * The user is registered for cleanup immediately. Ordinary fixtures never
 * receive admin metadata of any kind.
 */
export async function createDisposableUser(options: {
  admin: SupabaseClient;
  env: ValidatedE2EEnv;
  registry: E2EFixtureRegistry;
  workerIndex?: number;
}): Promise<DisposableUser> {
  const email = disposableFixtureEmail({
    runId: options.registry.runId,
    workerIndex: options.workerIndex,
    emailDomain: options.env.emailDomain,
  });
  assertAllowedFixtureIdentity(email, options.registry.runId);

  const { data, error } = await options.admin.auth.admin.createUser({
    email,
    password: options.env.testPassword,
    email_confirm: true,
    // No app_metadata and no roles: ordinary disposable fixtures must never
    // be global or tenant administrators.
  });
  if (error || !data.user) {
    throw new Error(`E2E disposable user creation failed: ${error?.code ?? 'unknown error'}`);
  }

  options.registry.register('auth_user', data.user.id, data.user.id);
  return { id: data.user.id, email };
}

/** Read only the given disposable user's provisioned profile row. */
export async function fetchProfileForUser(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin
    .from('profiles')
    .select('id, owner_user_id, tenant_id, slug, display_name, is_public')
    .eq('owner_user_id', userId)
    .maybeSingle();
  if (error) {
    throw new Error(`E2E profile read failed: ${error.code}`);
  }
  return data;
}

/**
 * Delete a disposable Auth user. Tolerates the account already being gone
 * (e.g. removed by the account-deletion flow under test).
 */
export async function deleteDisposableAuthUser(
  admin: SupabaseClient,
  userId: string,
): Promise<'deleted' | 'already_gone'> {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (!error) return 'deleted';
  if (error.status === 404 || /not.?found/i.test(error.message)) return 'already_gone';
  throw new Error(`E2E auth user cleanup failed: ${error.code ?? error.status}`);
}

/** True when the Auth user no longer exists (e.g. after account deletion). */
export async function authUserIsGone(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) {
    if (error.status === 404 || /not.?found/i.test(error.message)) return true;
    throw new Error(`E2E auth user lookup failed: ${error.code ?? error.status}`);
  }
  return !data.user;
}

/** Delete one tenant row created by signup provisioning for a disposable user. */
export async function deleteTenantById(
  admin: SupabaseClient,
  tenantId: string,
): Promise<'deleted' | 'already_gone'> {
  const { data, error } = await admin
    .from('tenants')
    .delete()
    .eq('id', tenantId)
    .select('id');
  if (error) {
    throw new Error(`E2E tenant cleanup failed: ${error.code}`);
  }
  return data && data.length > 0 ? 'deleted' : 'already_gone';
}

/**
 * Upload one tiny runtime-generated storage fixture. The path must already
 * carry the run and owner identity (see storageFixturePath); cleanup is
 * bounded to the registered object only.
 */
export async function uploadStorageFixture(options: {
  admin: SupabaseClient;
  registry: E2EFixtureRegistry;
  ownerUserId: string;
  bucket: string;
  path: string;
  content: Uint8Array;
  contentType: string;
}): Promise<void> {
  if (!options.path.includes(options.ownerUserId)) {
    throw new Error('E2E storage fixture path must include the disposable owner ID.');
  }
  const { error } = await options.admin.storage
    .from(options.bucket)
    .upload(options.path, options.content, { contentType: options.contentType });
  if (error) {
    throw new Error(`E2E storage fixture upload failed: ${error.message}`);
  }
  options.registry.register('storage_object', `${options.bucket}/${options.path}`, options.ownerUserId);
}

/** Delete one registered storage object (never bucket-wide). */
export async function deleteStorageObject(
  admin: SupabaseClient,
  bucketAndPath: string,
): Promise<'deleted' | 'already_gone'> {
  const [bucket, ...rest] = bucketAndPath.split('/');
  const path = rest.join('/');
  const { data, error } = await admin.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`E2E storage cleanup failed: ${error.message}`);
  }
  return data && data.length > 0 ? 'deleted' : 'already_gone';
}
