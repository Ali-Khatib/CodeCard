import { STORAGE_BUCKETS } from '@codecard/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  mapAvatarValidationMessage,
  validateAvatarFileMetadata,
} from '@/lib/profile/avatar-file-validation';

export const AVATAR_UPLOAD_BUCKET = STORAGE_BUCKETS.avatars;

export type AvatarUploadPhase = 'idle' | 'preparing' | 'uploading' | 'saving' | 'complete';

export type AvatarUploadInitResponse = {
  path: string;
  signedUrl: string;
  token: string;
  mimeType: string;
  maxBytes: number;
};

export type AvatarUploadFlowResult =
  | { ok: true; avatarUrl: string; path: string }
  | { ok: false; message: string; phase: AvatarUploadPhase | 'validation' };

const GENERIC_UPLOAD_ERROR = 'Could not upload image. Please try again.';
const GENERIC_SAVE_ERROR = 'Could not save your avatar. Please try again.';

export function validateAvatarFile(file: File) {
  return validateAvatarFileMetadata({
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  });
}

export { mapAvatarValidationMessage };

type UploadInitFetcher = (file: File) => Promise<
  | { ok: true; init: AvatarUploadInitResponse }
  | { ok: false; message: string }
>;

type StorageUploader = (
  init: AvatarUploadInitResponse,
  file: File,
) => Promise<{ ok: true } | { ok: false; message: string }>;

type FinalizeUpload = (path: string) => Promise<
  | { success: true; avatarUrl: string }
  | { success: false; error?: string }
>;

export async function requestAvatarUploadInit(
  file: File,
  fetchImpl: typeof fetch = fetch,
): Promise<
  | { ok: true; init: AvatarUploadInitResponse }
  | { ok: false; message: string }
> {
  const validation = validateAvatarFile(file);
  if (!validation.ok) {
    return { ok: false, message: mapAvatarValidationMessage(validation) };
  }

  const response = await fetchImpl('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resourceType: 'avatar',
      filename: file.name,
      mimeType: validation.mimeType,
      size: file.size,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (body?.error && body.error !== 'Forbidden') {
      return { ok: false, message: body.error };
    }
    return { ok: false, message: GENERIC_UPLOAD_ERROR };
  }

  const init = (await response.json()) as AvatarUploadInitResponse;
  if (!init.path || !init.token) {
    return { ok: false, message: GENERIC_UPLOAD_ERROR };
  }

  return { ok: true, init };
}

export async function uploadAvatarToSignedUrl(
  supabase: Pick<SupabaseClient, 'storage'>,
  init: AvatarUploadInitResponse,
  file: File,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase.storage
    .from(AVATAR_UPLOAD_BUCKET)
    .uploadToSignedUrl(init.path, init.token, file, {
      contentType: init.mimeType,
      upsert: false,
    });

  if (error) {
    return { ok: false, message: GENERIC_UPLOAD_ERROR };
  }

  return { ok: true };
}

export async function executeAvatarUploadFlow(input: {
  file: File;
  requestInit?: UploadInitFetcher;
  uploadToStorage: StorageUploader;
  finalizeUpload: FinalizeUpload;
  onPhaseChange?: (phase: AvatarUploadPhase) => void;
}): Promise<AvatarUploadFlowResult> {
  const validation = validateAvatarFile(input.file);
  if (!validation.ok) {
    return {
      ok: false,
      phase: 'validation',
      message: mapAvatarValidationMessage(validation),
    };
  }

  input.onPhaseChange?.('preparing');
  const requestInit = input.requestInit ?? requestAvatarUploadInit;
  const initResult = await requestInit(input.file);
  if (!initResult.ok) {
    return { ok: false, phase: 'preparing', message: initResult.message };
  }

  input.onPhaseChange?.('uploading');
  const uploadResult = await input.uploadToStorage(initResult.init, input.file);
  if (!uploadResult.ok) {
    return { ok: false, phase: 'uploading', message: uploadResult.message };
  }

  input.onPhaseChange?.('saving');
  const finalizeResult = await input.finalizeUpload(initResult.init.path);
  if (!finalizeResult.success) {
    return {
      ok: false,
      phase: 'saving',
      message: finalizeResult.error ?? GENERIC_SAVE_ERROR,
    };
  }

  input.onPhaseChange?.('complete');
  return {
    ok: true,
    avatarUrl: finalizeResult.avatarUrl,
    path: initResult.init.path,
  };
}
