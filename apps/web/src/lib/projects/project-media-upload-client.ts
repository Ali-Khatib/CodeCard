import { STORAGE_BUCKETS } from '@codecard/config';
import {
  PROJECT_MEDIA_IMAGE_MIME_TYPES,
  UPLOAD_IMAGE_MAX_BYTES,
  type ProjectMediaRole,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';

export const PROJECT_MEDIA_UPLOAD_BUCKET = STORAGE_BUCKETS.projectMedia;

export type ProjectMediaUploadPhase =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'saving'
  | 'complete';

export type ProjectMediaUploadInitResponse = {
  path: string;
  signedUrl: string;
  token: string;
  mimeType: string;
  maxBytes: number;
};

export type ProjectMediaUploadFlowResult =
  | { ok: true; path: string; assetId: string }
  | { ok: false; message: string; phase: ProjectMediaUploadPhase | 'validation' };

const GENERIC_UPLOAD_ERROR = 'Could not upload image. Please try again.';
const GENERIC_SAVE_ERROR = 'Could not save project media. Please try again.';

const BLOCKED_EXTENSIONS = new Set([
  'svg',
  'html',
  'htm',
  'js',
  'mjs',
  'cjs',
  'exe',
  'bat',
  'cmd',
  'sh',
  'php',
  'jar',
  'vbs',
]);

const MIME_TO_EXTENSIONS: Record<string, readonly string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

function extractExtension(filename: string): string | null {
  const trimmed = filename.trim();
  if (!trimmed || trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
    return null;
  }
  const parts = trimmed.split('.');
  if (parts.length !== 2) return null;
  const extension = parts[1]?.trim().toLowerCase();
  if (!extension || !/^[a-z0-9]{2,5}$/.test(extension)) return null;
  return extension;
}

export function validateProjectMediaFile(file: File): {
  ok: true;
  mimeType: string;
} | {
  ok: false;
  message: string;
} {
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, message: 'File size must be greater than zero.' };
  }

  const extension = extractExtension(file.name);
  if (!extension) {
    return { ok: false, message: 'Invalid filename.' };
  }

  if (BLOCKED_EXTENSIONS.has(extension)) {
    return { ok: false, message: 'Use a JPEG, PNG, or WebP image.' };
  }

  const normalizedMime = file.type.trim().toLowerCase();
  if (
    !PROJECT_MEDIA_IMAGE_MIME_TYPES.includes(
      normalizedMime as (typeof PROJECT_MEDIA_IMAGE_MIME_TYPES)[number],
    )
  ) {
    return { ok: false, message: 'Use a JPEG, PNG, or WebP image.' };
  }

  const mimeExtensions = MIME_TO_EXTENSIONS[normalizedMime] ?? [];
  if (!mimeExtensions.includes(extension)) {
    return { ok: false, message: 'File type does not match filename.' };
  }

  if (file.size > UPLOAD_IMAGE_MAX_BYTES) {
    return { ok: false, message: 'Image must be 5 MB or smaller.' };
  }

  return { ok: true, mimeType: normalizedMime };
}

export async function requestProjectMediaUploadInit(
  input: {
    projectId: string;
    mediaRole: ProjectMediaRole;
    file: File;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<
  | { ok: true; init: ProjectMediaUploadInitResponse }
  | { ok: false; message: string }
> {
  const validation = validateProjectMediaFile(input.file);
  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  const response = await fetchImpl('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resourceType: 'project-media',
      resourceId: input.projectId,
      mediaRole: input.mediaRole,
      filename: input.file.name,
      mimeType: validation.mimeType,
      size: input.file.size,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (body?.error && body.error !== 'Forbidden') {
      return { ok: false, message: body.error };
    }
    return { ok: false, message: GENERIC_UPLOAD_ERROR };
  }

  const init = (await response.json()) as ProjectMediaUploadInitResponse;
  if (!init.path || !init.token) {
    return { ok: false, message: GENERIC_UPLOAD_ERROR };
  }

  return { ok: true, init };
}

export async function uploadProjectMediaToSignedUrl(
  supabase: Pick<SupabaseClient, 'storage'>,
  init: ProjectMediaUploadInitResponse,
  file: File,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase.storage
    .from(PROJECT_MEDIA_UPLOAD_BUCKET)
    .uploadToSignedUrl(init.path, init.token, file, {
      contentType: init.mimeType,
      upsert: false,
    });

  if (error) {
    return { ok: false, message: GENERIC_UPLOAD_ERROR };
  }

  return { ok: true };
}

export async function executeProjectMediaUploadFlow(input: {
  projectId: string;
  mediaRole: ProjectMediaRole;
  file: File;
  requestInit?: typeof requestProjectMediaUploadInit;
  uploadToStorage: (
    init: ProjectMediaUploadInitResponse,
    file: File,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  finalizeUpload: (
    path: string,
  ) => Promise<{ success: true; assetId: string } | { success: false; error?: string }>;
  onPhaseChange?: (phase: ProjectMediaUploadPhase) => void;
}): Promise<ProjectMediaUploadFlowResult> {
  const validation = validateProjectMediaFile(input.file);
  if (!validation.ok) {
    return { ok: false, phase: 'validation', message: validation.message };
  }

  input.onPhaseChange?.('preparing');
  const requestInit = input.requestInit ?? requestProjectMediaUploadInit;
  const initResult = await requestInit({
    projectId: input.projectId,
    mediaRole: input.mediaRole,
    file: input.file,
  });
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
    path: initResult.init.path,
    assetId: finalizeResult.assetId,
  };
}
