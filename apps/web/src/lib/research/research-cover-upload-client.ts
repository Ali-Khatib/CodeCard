import { optimizeImageForUpload } from '@/lib/storage/optimize-image';
import { uploadFileToSignedUrlWithProgress } from '@/lib/storage/signed-upload-transport';
import { readFileContentPrefixBase64 } from '@/lib/storage/upload-content-prefix';
import {
  isRetryableUploadFailure,
  type UploadFailureClass,
} from '@/lib/storage/upload-failure';
import { validateResearchFigureFile } from '@/lib/research/research-figure-upload-client';

export type ResearchCoverUploadResult =
  | { ok: true; coverImageUrl: string }
  | {
      ok: false;
      message: string;
      failureClass: UploadFailureClass;
      retryable: boolean;
    };

export async function executeResearchCoverUploadFlow(input: {
  researchPaperId: string;
  file: File;
  finalize: (args: { researchPaperId: string; path: string }) => Promise<{
    success?: boolean;
    error?: string;
    coverImageUrl?: string;
  }>;
  fetchImpl?: typeof fetch;
}): Promise<ResearchCoverUploadResult> {
  const validation = validateResearchFigureFile(input.file);
  if (!validation.ok) {
    return {
      ok: false,
      message: validation.message,
      failureClass: 'validation',
      retryable: false,
    };
  }

  const optimized = await optimizeImageForUpload(input.file);
  if (!optimized.ok && !optimized.canUseOriginal) {
    return {
      ok: false,
      message: optimized.message,
      failureClass: 'validation',
      retryable: false,
    };
  }
  const uploadFile = optimized.ok ? optimized.file : input.file;
  const uploadValidation = validateResearchFigureFile(uploadFile);
  if (!uploadValidation.ok) {
    return {
      ok: false,
      message: uploadValidation.message,
      failureClass: 'validation',
      retryable: false,
    };
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const contentPrefixBase64 = await readFileContentPrefixBase64(uploadFile);
  const response = await fetchImpl('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      resourceType: 'research-figure',
      resourceId: input.researchPaperId,
      purpose: 'cover',
      filename: uploadFile.name,
      mimeType: uploadValidation.mimeType,
      size: uploadFile.size,
      contentPrefixBase64,
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      message: 'Could not start the banner upload. Please try again.',
      failureClass: 'upload_authorization',
      retryable: true,
    };
  }

  const init = (await response.json()) as {
    path?: string;
    signedUrl?: string;
    token?: string;
    mimeType?: string;
  };
  if (!init.path || !init.signedUrl || !init.token || !init.mimeType) {
    return {
      ok: false,
      message: 'Could not start the banner upload. Please try again.',
      failureClass: 'upload_authorization',
      retryable: true,
    };
  }

  const signedUrl = init.signedUrl.includes('token=')
    ? init.signedUrl
    : `${init.signedUrl}${init.signedUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(init.token)}`;

  const put = await uploadFileToSignedUrlWithProgress({
    signedUrl,
    file: uploadFile,
    contentType: init.mimeType,
    upsert: false,
  });
  if (!put.ok) {
    return {
      ok: false,
      message: put.message,
      failureClass: put.failureClass,
      retryable: isRetryableUploadFailure(put.failureClass),
    };
  }

  const finalized = await input.finalize({
    researchPaperId: input.researchPaperId,
    path: init.path,
  });
  if (!finalized.success || !finalized.coverImageUrl) {
    return {
      ok: false,
      message: finalized.error ?? 'Could not save the research banner. Please try again.',
      failureClass: 'finalization',
      retryable: true,
    };
  }

  return { ok: true, coverImageUrl: finalized.coverImageUrl };
}
