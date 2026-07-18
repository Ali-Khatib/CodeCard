import 'server-only';

import { apiError, internalError, unauthorized } from '@/lib/api-utils';
import { resolveGlobalAdminAuthorization } from '@/lib/security/admin-authorization';
import { createClient } from '@/lib/supabase/server';

type AdminApiAuthorization =
  | { ok: true; userId: string }
  | { ok: false; response: ReturnType<typeof apiError> };

/**
 * API-specific global-admin authorization.
 *
 * Unlike the page gate, API callers receive 401/403 JSON and are never
 * redirected. The privileged service client must only be created after this
 * function returns an authorized identity.
 */
export async function requireGlobalAdminApiAccess(): Promise<AdminApiAuthorization> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return { ok: false, response: unauthorized() };
    }

    const decision = resolveGlobalAdminAuthorization({
      userId: data.user.id,
      appMetadata: data.user.app_metadata ?? null,
    });

    if (!decision.authorized) {
      return { ok: false, response: apiError('Forbidden', 403) };
    }

    return { ok: true, userId: data.user.id };
  } catch {
    return { ok: false, response: internalError() };
  }
}
