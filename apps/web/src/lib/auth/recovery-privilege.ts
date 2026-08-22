import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { PASSWORD_RECOVERY_APP_METADATA_KEY } from '@/lib/auth/recovery-session';

/**
 * Stamp password-recovery privilege on the Auth user (service role only).
 * Preserves existing app_metadata (including admin role).
 */
export async function stampPasswordRecoveryPrivilege(userId: string): Promise<void> {
  const service = await createServiceClient();
  const { data, error } = await service.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new Error('recovery_privilege_lookup_failed');
  }

  const existing = (data.user.app_metadata ?? {}) as Record<string, unknown>;
  const { error: updateError } = await service.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...existing,
      [PASSWORD_RECOVERY_APP_METADATA_KEY]: true,
    },
  });
  if (updateError) {
    throw new Error('recovery_privilege_stamp_failed');
  }
}

/**
 * Clear password-recovery privilege after a successful password change.
 * GoTrue merges app_metadata — omit is not enough; set the key to null to delete.
 */
export async function clearPasswordRecoveryPrivilege(userId: string): Promise<void> {
  const service = await createServiceClient();
  const { data, error } = await service.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new Error('recovery_privilege_lookup_failed');
  }

  const existing = (data.user.app_metadata ?? {}) as Record<string, unknown>;
  if (existing[PASSWORD_RECOVERY_APP_METADATA_KEY] !== true) {
    return;
  }

  const { error: updateError } = await service.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...existing,
      [PASSWORD_RECOVERY_APP_METADATA_KEY]: null,
    },
  });
  if (updateError) {
    throw new Error('recovery_privilege_clear_failed');
  }
}
