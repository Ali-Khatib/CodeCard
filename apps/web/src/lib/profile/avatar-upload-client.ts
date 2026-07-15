import { STORAGE_BUCKETS } from '@codecard/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  mapAvatarValidationMessage,
  validateAvatarFileMetadata,
} from '@/lib/profile/avatar-file-validation';
import {
  formatOptimizationSavings,
  optimizeImageForUpload,
  type OptimizeImageResult,
} from '@/lib/storage/optimize-image';
import { uploadFileToSignedUrlWithProgress } from '@/lib/storage/signed-upload-transport';
import {
  classifyInitFailure,
  isRetryableUploadFailure,
  messageForUploadFailure,
  type UploadFailureClass,
} from '@/lib/storage/upload-failure';
import type { UploadStage } from '@/lib/storage/upload-progress';

export const AVATAR_UPLOAD_BUCKET = STORAGE_BUCKETS.avatars;

/** Prefer UploadStage; legacy aliases kept for existing tests/components. */
export type AvatarUploadPhase =
  | UploadStage
  | 'preparing'
  | 'saving';

export type AvatarUploadInitResponse = {
  path: string;
  signedUrl: string;
  token: string;
  mimeType: string;
  maxBytes: number;
};

export type AvatarUploadFlowResult =
  | {
      ok: true;
      avatarUrl: string;
      path: string;
      cleanupWarning?: boolean;
      optimizationNote?: string | null;
      uploadFileBytes?: number;
    }
  | {
      ok: false;
      message: string;
      phase: AvatarUploadPhase | 'validation';
      failureClass: UploadFailureClass;
      retryable: boolean;
      cancelled?: boolean;
    };

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
  | { ok: false; message: string; failureClass?: UploadFailureClass; retryable?: boolean }
>;

type StorageUploader = (
  init: AvatarUploadInitResponse,
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

type FinalizeUpload = (path: string) => Promise<
  | { success: true; avatarUrl: string; cleanupWarning?: boolean }
  | { success: false; error?: string }
>;

export async function requestAvatarUploadInit(
  file: File,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<
  | { ok: true; init: AvatarUploadInitResponse }
  | { ok: false; message: string; failureClass: UploadFailureClass; retryable: boolean }
> {
  const validation = validateAvatarFile(file);
  if (!validation.ok) {
    return {
      ok: false,
      message: mapAvatarValidationMessage(validation),
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
        resourceType: 'avatar',
        filename: file.name,
        mimeType: validation.mimeType,
        size: file.size,
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

  const init = (await response.json()) as AvatarUploadInitResponse;
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

/**
 * Direct signed-URL upload with byte progress. Prefer this over the SDK helper for UI progress.
 */
export async function uploadAvatarToSignedUrl(
  _supabase: Pick<SupabaseClient, 'storage'> | null,
  init: AvatarUploadInitResponse,
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
  void AVATAR_UPLOAD_BUCKET;

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

export async function executeAvatarUploadFlow(input: {
  file: File;
  requestInit?: UploadInitFetcher;
  uploadToStorage: StorageUploader;
  finalizeUpload: FinalizeUpload;
  optimizeImage?: (file: File, options?: { signal?: AbortSignal }) => Promise<OptimizeImageResult>;
  onPhaseChange?: (phase: AvatarUploadPhase) => void;
  onProgress?: (progress: { loaded: number; total: number; percent: number | null }) => void;
  signal?: AbortSignal;
}): Promise<AvatarUploadFlowResult> {
  const validation = validateAvatarFile(input.file);
  if (!validation.ok) {
    return {
      ok: false,
      phase: 'validation',
      failureClass: 'validation',
      retryable: false,
      message: mapAvatarValidationMessage(validation),
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

  input.onPhaseChange?.('optimizing');
  const optimize = input.optimizeImage ?? optimizeImageForUpload;
  const optimized = await optimize(input.file, { signal: input.signal });
  if (!optimized.ok) {
    if (optimized.cancelled) {
      return {
        ok: false,
        phase: 'cancelled',
        failureClass: 'cancelled',
        retryable: true,
        cancelled: true,
        message: messageForUploadFailure('cancelled'),
      };
    }
    if (!optimized.canUseOriginal) {
      return {
        ok: false,
        phase: 'optimizing',
        failureClass: 'validation',
        retryable: false,
        message: optimized.message,
      };
    }
  }

  const uploadFile = optimized.ok ? optimized.file : input.file;
  const uploadValidation = validateAvatarFile(uploadFile);
  if (!uploadValidation.ok) {
    return {
      ok: false,
      phase: 'validation',
      failureClass: 'validation',
      retryable: false,
      message: mapAvatarValidationMessage(uploadValidation),
    };
  }

  const optimizationNote =
    optimized.ok && optimized.transformed
      ? formatOptimizationSavings(optimized.originalBytes, optimized.outputBytes)
      : null;

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
  const requestInit = input.requestInit ?? ((file: File) => requestAvatarUploadInit(file, fetch, input.signal));
  const initResult = await requestInit(uploadFile);
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
  const uploadResult = await input.uploadToStorage(initResult.init, uploadFile, {
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
    avatarUrl: finalizeResult.avatarUrl,
    path: initResult.init.path,
    cleanupWarning: finalizeResult.cleanupWarning,
    optimizationNote,
    uploadFileBytes: uploadFile.size,
  };
}
