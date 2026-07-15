import { STORAGE_BUCKETS } from '@codecard/config';
import {
  PROJECT_MEDIA_IMAGE_MIME_TYPES,
  UPLOAD_IMAGE_MAX_BYTES,
  type ProjectMediaRole,
} from '@codecard/validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadFileToSignedUrlWithProgress } from '@/lib/storage/signed-upload-transport';
import {
  classifyInitFailure,
  isRetryableUploadFailure,
  messageForUploadFailure,
  type UploadFailureClass,
} from '@/lib/storage/upload-failure';
import type { UploadStage } from '@/lib/storage/upload-progress';

export const PROJECT_MEDIA_UPLOAD_BUCKET = STORAGE_BUCKETS.projectMedia;

export type ProjectMediaUploadPhase =
  | UploadStage
  | 'preparing'
  | 'saving'
  | 'validation'
  | 'error';

export type ProjectMediaUploadInitResponse = {
  path: string;
  signedUrl: string;
  token: string;
  mimeType: string;
  maxBytes: number;
};

export type ProjectMediaUploadFlowResult =
  | { ok: true; path: string; assetId: string; cleanupWarning?: boolean }
  | {
      ok: false;
      message: string;
      phase: ProjectMediaUploadPhase;
      failureClass: UploadFailureClass;
      retryable: boolean;
      cancelled?: boolean;
    };

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
  signal?: AbortSignal,
): Promise<
  | { ok: true; init: ProjectMediaUploadInitResponse }
  | { ok: false; message: string; failureClass: UploadFailureClass; retryable: boolean }
> {
  const validation = validateProjectMediaFile(input.file);
  if (!validation.ok) {
    return {
      ok: false,
      message: validation.message,
      failureClass: 'validation',
      retryable: false,
    };
  }

  let response: Response;
  try {
    response = await fetchImpl('/api/upload', {
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
      signal,
    });
  } catch (error) {
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      return {
        ok: false,
        message: messageForUploadFailure('cancelled'),
        failureClass: 'cancelled',
        retryable: true,
      };
    }
    return {
      ok: false,
      message: messageForUploadFailure('network'),
      failureClass: 'network',
      retryable: true,
    };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    const failure = classifyInitFailure(response.status, body?.error);
    return { ok: false as const, ...failure };
  }

  const init = (await response.json()) as ProjectMediaUploadInitResponse;
  if (!init.path || !init.token || !init.signedUrl) {
    return {
      ok: false,
      message: GENERIC_UPLOAD_ERROR,
      failureClass: 'upload_authorization',
      retryable: true,
    };
  }

  return { ok: true, init };
}

export async function uploadProjectMediaToSignedUrl(
  _supabase: Pick<SupabaseClient, 'storage'> | null,
  init: ProjectMediaUploadInitResponse,
  file: File,
  options?: {
    onProgress?: (progress: { loaded: number; total: number; percent: number | null }) => void;
    signal?: AbortSignal;
  },
): Promise<
  | { ok: true }
  | {
      ok: false;
      message: string;
      failureClass: UploadFailureClass;
      cancelled?: boolean;
    }
> {
  void _supabase;
  void PROJECT_MEDIA_UPLOAD_BUCKET;

  const result = await uploadFileToSignedUrlWithProgress({
    signedUrl: init.signedUrl.includes('token=')
      ? init.signedUrl
      : `${init.signedUrl}${init.signedUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(init.token)}`,
    file,
    contentType: init.mimeType,
    upsert: false,
    onProgress: options?.onProgress,
    signal: options?.signal,
  });

  if (result.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    message: result.message,
    failureClass: result.failureClass,
    cancelled: result.cancelled,
  };
}

export async function executeProjectMediaUploadFlow(input: {
  projectId: string;
  mediaRole: ProjectMediaRole;
  file: File;
  requestInit?: typeof requestProjectMediaUploadInit;
  uploadToStorage: (
    init: ProjectMediaUploadInitResponse,
    file: File,
    options?: {
      onProgress?: (progress: { loaded: number; total: number; percent: number | null }) => void;
      signal?: AbortSignal;
    },
  ) => Promise<
    | { ok: true }
    | {
        ok: false;
        message: string;
        failureClass?: UploadFailureClass;
        cancelled?: boolean;
      }
  >;
  finalizeUpload: (
    path: string,
  ) => Promise<
    | { success: true; assetId: string; cleanupWarning?: boolean }
    | { success: false; error?: string }
  >;
  onPhaseChange?: (phase: ProjectMediaUploadPhase) => void;
  onProgress?: (progress: { loaded: number; total: number; percent: number | null }) => void;
  signal?: AbortSignal;
}): Promise<ProjectMediaUploadFlowResult> {
  const validation = validateProjectMediaFile(input.file);
  if (!validation.ok) {
    return {
      ok: false,
      phase: 'validation',
      failureClass: 'validation',
      retryable: false,
      message: validation.message,
    };
  }

  if (input.signal?.aborted) {
    return {
      ok: false,
      phase: 'cancelled',
      failureClass: 'cancelled',
      retryable: true,
      cancelled: true,
      message: messageForUploadFailure('cancelled'),
    };
  }

  input.onPhaseChange?.('authorizing');
  const requestInit = input.requestInit ?? requestProjectMediaUploadInit;
  const initResult = await requestInit(
    {
      projectId: input.projectId,
      mediaRole: input.mediaRole,
      file: input.file,
    },
    fetch,
    input.signal,
  );
  if (!initResult.ok) {
    const failureClass = initResult.failureClass ?? 'upload_authorization';
    return {
      ok: false,
      phase: failureClass === 'cancelled' ? 'cancelled' : 'authorizing',
      failureClass,
      retryable: initResult.retryable ?? isRetryableUploadFailure(failureClass),
      cancelled: failureClass === 'cancelled',
      message: initResult.message,
    };
  }

  if (input.signal?.aborted) {
    return {
      ok: false,
      phase: 'cancelled',
      failureClass: 'cancelled',
      retryable: true,
      cancelled: true,
      message: messageForUploadFailure('cancelled'),
    };
  }

  input.onPhaseChange?.('uploading');
  const uploadResult = await input.uploadToStorage(initResult.init, input.file, {
    onProgress: input.onProgress,
    signal: input.signal,
  });
  if (!uploadResult.ok) {
    const failureClass = uploadResult.failureClass ?? 'network';
    return {
      ok: false,
      phase: uploadResult.cancelled ? 'cancelled' : 'uploading',
      failureClass,
      retryable: isRetryableUploadFailure(failureClass),
      cancelled: uploadResult.cancelled,
      message: uploadResult.message,
    };
  }

  input.onPhaseChange?.('finalizing');
  const finalizeResult = await input.finalizeUpload(initResult.init.path);
  if (!finalizeResult.success) {
    return {
      ok: false,
      phase: 'finalizing',
      failureClass: 'finalization',
      retryable: true,
      message: finalizeResult.error ?? GENERIC_SAVE_ERROR,
    };
  }

  input.onPhaseChange?.('complete');
  return {
    ok: true,
    path: initResult.init.path,
    assetId: finalizeResult.assetId,
    cleanupWarning: finalizeResult.cleanupWarning,
  };
}
