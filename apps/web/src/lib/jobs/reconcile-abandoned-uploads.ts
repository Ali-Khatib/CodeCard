import type { SupabaseClient } from '@supabase/supabase-js';
import { reconcileAbandonedUploadIntents } from '@/lib/storage/upload-intents';

/**
 * Executable orphan reconciliation for abandoned signed uploads (WS11-T010).
 * Scheduling belongs to later ops/WS14 — call with a service-role client locally
 * or from an admin-safe maintenance job. Never log signed URLs or tokens.
 */
export async function runAbandonedUploadReconciliation(
  serviceSupabase: SupabaseClient,
  options: {
    gracePeriodHours?: number;
    dryRun?: boolean;
  } = {},
): Promise<{ candidates: number; abandoned: number; dryRun: boolean }> {
  return reconcileAbandonedUploadIntents(serviceSupabase, {
    gracePeriodHours: options.gracePeriodHours ?? 24,
    dryRun: options.dryRun ?? false,
  });
}
