import type { SupabaseClient } from '@supabase/supabase-js';
import type { UploadOwnershipContext } from '@/lib/storage/upload-ownership';

export type UploadIntentRecord = {
  bucket: string;
  object_path: string;
  mime_type: string;
  max_bytes: number;
  resource_type: string;
  resource_id: string;
};

export async function recordUploadIntent(
  supabase: SupabaseClient,
  ownership: UploadOwnershipContext,
  intent: { bucket: string; path: string; mimeType: string; maxBytes: number },
): Promise<{ ok: true } | { ok: false }> {
  const { error } = await supabase.from('storage_upload_intents').insert({
    owner_user_id: ownership.ownerUserId,
    tenant_id: ownership.tenantId,
    bucket: intent.bucket,
    object_path: intent.path,
    resource_type: ownership.resourceType,
    resource_id: ownership.resourceId,
    mime_type: intent.mimeType,
    max_bytes: intent.maxBytes,
  });
  if (error) return { ok: false };
  return { ok: true };
}

export async function markUploadIntentFinalized(
  supabase: SupabaseClient,
  objectPath: string,
): Promise<void> {
  await supabase
    .from('storage_upload_intents')
    .update({ finalized_at: new Date().toISOString() })
    .eq('object_path', objectPath)
    .is('finalized_at', null);
}

export async function loadOpenUploadIntent(
  supabase: SupabaseClient,
  objectPath: string,
): Promise<UploadIntentRecord | null> {
  const { data } = await supabase
    .from('storage_upload_intents')
    .select('bucket, object_path, mime_type, max_bytes, resource_type, resource_id')
    .eq('object_path', objectPath)
    .is('finalized_at', null)
    .is('abandoned_at', null)
    .maybeSingle();
  return (data as UploadIntentRecord | null) ?? null;
}

/**
 * Mark open intents older than gracePeriodHours as abandoned and remove their storage objects.
 * Idempotent. Does not delete referenced/finalized objects.
 */
export async function reconcileAbandonedUploadIntents(
  supabase: SupabaseClient,
  options: {
    gracePeriodHours?: number;
    dryRun?: boolean;
    now?: Date;
    removeObject?: (bucket: string, path: string) => Promise<void>;
  } = {},
): Promise<{ candidates: number; abandoned: number; dryRun: boolean }> {
  const gracePeriodHours = options.gracePeriodHours ?? 24;
  const dryRun = options.dryRun ?? false;
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - gracePeriodHours * 60 * 60 * 1000).toISOString();

  const { data: rows } = await supabase
    .from('storage_upload_intents')
    .select('id, bucket, object_path')
    .is('finalized_at', null)
    .is('abandoned_at', null)
    .lt('created_at', cutoff);

  const candidates = rows?.length ?? 0;
  if (dryRun || !rows?.length) {
    return { candidates, abandoned: 0, dryRun };
  }

  let abandoned = 0;
  for (const row of rows) {
    if (options.removeObject) {
      await options.removeObject(row.bucket, row.object_path);
    } else {
      await supabase.storage.from(row.bucket).remove([row.object_path]);
    }
    const { error } = await supabase
      .from('storage_upload_intents')
      .update({ abandoned_at: now.toISOString() })
      .eq('id', row.id)
      .is('finalized_at', null);
    if (!error) abandoned += 1;
  }

  return { candidates, abandoned, dryRun: false };
}
