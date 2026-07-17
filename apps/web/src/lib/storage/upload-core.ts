import type { SupabaseClient } from '@supabase/supabase-js';
import { buildCanonicalStoragePath } from '@/lib/storage/path';
import type { UploadOwnershipContext } from '@/lib/storage/upload-ownership';
import type { UploadValidationResult } from '@/lib/storage/upload-validation';
import { recordUploadIntent } from '@/lib/storage/upload-intents';

export type SignedUploadIntent = {
  bucket: string;
  path: string;
  signedUrl: string;
  token: string;
  mimeType: string;
  maxBytes: number;
};

export type SignedUploadResult =
  | { ok: true; intent: SignedUploadIntent }
  | { ok: false; status: 500; message: string };

export async function createSignedUploadIntent(
  supabase: SupabaseClient,
  ownership: UploadOwnershipContext,
  validation: Extract<UploadValidationResult, { ok: true }>,
): Promise<SignedUploadResult> {
  const location = buildCanonicalStoragePath({
    tenantId: ownership.tenantId,
    ownerUserId: ownership.ownerUserId,
    resourceType: ownership.resourceType,
    resourceId: ownership.resourceId,
    extension: validation.extension,
  });

  const { data, error } = await supabase.storage
    .from(location.bucket)
    .createSignedUploadUrl(location.path);

  if (error || !data?.signedUrl || !data.token) {
    return {
      ok: false,
      status: 500,
      message: 'Could not prepare upload. Please try again.',
    };
  }

  const recorded = await recordUploadIntent(supabase, ownership, {
    bucket: location.bucket,
    path: location.path,
    mimeType: validation.mimeType,
    maxBytes: validation.maxBytes,
  });
  if (!recorded.ok) {
    return {
      ok: false,
      status: 500,
      message: 'Could not prepare upload. Please try again.',
    };
  }

  return {
    ok: true,
    intent: {
      bucket: location.bucket,
      path: location.path,
      signedUrl: data.signedUrl,
      token: data.token,
      mimeType: validation.mimeType,
      maxBytes: validation.maxBytes,
    },
  };
}
