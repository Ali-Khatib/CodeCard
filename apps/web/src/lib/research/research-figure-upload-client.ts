import {
  RESEARCH_FIGURE_MIME_TYPES,
  UPLOAD_IMAGE_MAX_BYTES,
} from '@codecard/validation';
import { uploadFileToSignedUrlWithProgress } from '@/lib/storage/signed-upload-transport';
import {
  formatOptimizationSavings,
  optimizeImageForUpload,
} from '@/lib/storage/optimize-image';
import {
  classifyInitFailure,
  isRetryableUploadFailure,
  messageForUploadFailure,
  type UploadFailureClass,
} from '@/lib/storage/upload-failure';
import type { UploadStage } from '@/lib/storage/upload-progress';

export type ResearchFigureUploadPhase = UploadStage | 'validation' | 'preparing' | 'saving' | 'error';

export type ResearchFigureUploadInitResponse = {
  path: string;
  signedUrl: string;
  token: string;
  mimeType: string;
  maxBytes: number;
};

export type ResearchFigureUploadFlowResult =
  | {
      ok: true;
      path: string;
      figureId: string;
      cleanupWarning?: boolean;
      optimizationNote?: string | null;
      uploadFileBytes?: number;
    }
  | {
      ok: false;
      message: string;
      phase: ResearchFigureUploadPhase;
      failureClass: UploadFailureClass;
      retryable: boolean;
      cancelled?: boolean;
    };

const GENERIC_UPLOAD_ERROR = 'Could not upload figure. Please try again.';
const GENERIC_SAVE_ERROR = 'Could not save research figure. Please try again.';

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
  'pdf',
  'gif',
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

export function validateResearchFigureFile(file: File): {
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
    !RESEARCH_FIGURE_MIME_TYPES.includes(
      normalizedMime as (typeof RESEARCH_FIGURE_MIME_TYPES)[number],
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

export async function requestResearchFigureUploadInit(
  input: {
    researchPaperId: string;
    file: File;
  },
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<
  | { ok: true; init: ResearchFigureUploadInitResponse }
  | { ok: false; message: string; failureClass: UploadFailureClass; retryable: boolean }
> {
  const validation = validateResearchFigureFile(input.file);
  if (!validation.ok) {
    return {
      ok: false,
      message: validation.message,
      failureClass: 'validation',
      retryable: false,
    };
  }

  try {
    const response = await fetchImpl('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceType: 'research-figure',
        resourceId: input.researchPaperId,
        filename: input.file.name,
        mimeType: validation.mimeType,
        size: input.file.size,
      }),
      signal,
      credentials: 'same-origin',
    });

    if (!response.ok) {
      let bodyError: string | undefined;
      try {
        const body = (await response.json()) as { error?: string };
        bodyError = body.error;
      } catch {
        bodyError = undefined;
      }
      const failure = classifyInitFailure(response.status, bodyError);
      return { ok: false, ...failure };
    }

    const body = (await response.json()) as ResearchFigureUploadInitResponse;
    if (!body.path || !body.signedUrl || !body.token) {
      return {
        ok: false,
        message: GENERIC_UPLOAD_ERROR,
        failureClass: 'upload_authorization',
        retryable: true,
      };
    }

    return { ok: true, init: body };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        message: 'Upload cancelled.',
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
}

export async function executeResearchFigureUploadFlow(input: {
  researchPaperId: string;
  file: File;
  replaceFigureId?: string;
  finalize: (args: {
    researchPaperId: string;
    path: string;
    replaceFigureId?: string;
  }) => Promise<{
    success?: boolean;
    error?: string;
    figure?: { id: string };
    cleanupWarning?: boolean;
  }>;
  onStage?: (stage: UploadStage, percent?: number | null) => void;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}): Promise<ResearchFigureUploadFlowResult> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const onStage = input.onStage ?? (() => undefined);

  const validation = validateResearchFigureFile(input.file);
  if (!validation.ok) {
    return {
      ok: false,
      message: validation.message,
      phase: 'validation',
      failureClass: 'validation',
      retryable: false,
    };
  }

  onStage('optimizing');
  const optimized = await optimizeImageForUpload(input.file, { signal: input.signal });
  if (!optimized.ok) {
    if (optimized.cancelled) {
      return {
        ok: false,
        message: messageForUploadFailure('cancelled'),
        phase: 'cancelled',
        failureClass: 'cancelled',
        retryable: true,
        cancelled: true,
      };
    }
    if (!optimized.canUseOriginal) {
      return {
        ok: false,
        message: optimized.message,
        phase: 'optimizing',
        failureClass: 'validation',
        retryable: false,
      };
    }
  }

  const uploadFile = optimized.ok ? optimized.file : input.file;
  const uploadValidation = validateResearchFigureFile(uploadFile);
  if (!uploadValidation.ok) {
    return {
      ok: false,
      message: uploadValidation.message,
      phase: 'validation',
      failureClass: 'validation',
      retryable: false,
    };
  }

  const optimizationNote =
    optimized.ok && optimized.transformed
      ? formatOptimizationSavings(optimized.originalBytes, optimized.outputBytes)
      : null;

  if (input.signal?.aborted) {
    return {
      ok: false,
      message: messageForUploadFailure('cancelled'),
      phase: 'cancelled',
      failureClass: 'cancelled',
      retryable: true,
      cancelled: true,
    };
  }

  onStage('authorizing');
  const initResult = await requestResearchFigureUploadInit(
    {
      researchPaperId: input.researchPaperId,
      file: uploadFile,
    },
    fetchImpl,
    input.signal,
  );

  if (!initResult.ok) {
    return {
      ok: false,
      message: initResult.message,
      phase: initResult.failureClass === 'cancelled' ? 'cancelled' : 'authorizing',
      failureClass: initResult.failureClass,
      retryable: initResult.retryable,
      cancelled: initResult.failureClass === 'cancelled',
    };
  }

  onStage('uploading', 0);
  const signedUrl = initResult.init.signedUrl.includes('token=')
    ? initResult.init.signedUrl
    : `${initResult.init.signedUrl}${initResult.init.signedUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(initResult.init.token)}`;

  const put = await uploadFileToSignedUrlWithProgress({
    signedUrl,
    file: uploadFile,
    contentType: initResult.init.mimeType,
    upsert: false,
    signal: input.signal,
    onProgress: (progress) => onStage('uploading', progress.percent),
  });

  if (!put.ok) {
    return {
      ok: false,
      message: put.message,
      phase: put.cancelled ? 'cancelled' : 'uploading',
      failureClass: put.failureClass,
      retryable: isRetryableUploadFailure(put.failureClass),
      cancelled: put.cancelled,
    };
  }

  onStage('finalizing');
  try {
    const finalized = await input.finalize({
      researchPaperId: input.researchPaperId,
      path: initResult.init.path,
      replaceFigureId: input.replaceFigureId,
    });

    if (!finalized.success || !finalized.figure?.id) {
      return {
        ok: false,
        message: finalized.error ?? GENERIC_SAVE_ERROR,
        phase: 'finalizing',
        failureClass: 'finalization',
        retryable: true,
      };
    }

    onStage('complete', 100);
    return {
      ok: true,
      path: initResult.init.path,
      figureId: finalized.figure.id,
      cleanupWarning: finalized.cleanupWarning,
      optimizationNote,
      uploadFileBytes: uploadFile.size,
    };
  } catch {
    return {
      ok: false,
      message: GENERIC_SAVE_ERROR,
      phase: 'finalizing',
      failureClass: 'finalization',
      retryable: true,
    };
  }
}
