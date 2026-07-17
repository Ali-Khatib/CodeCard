import {
  classifyHttpUploadFailure,
  messageForUploadFailure,
  type UploadFailureClass,
} from '@/lib/storage/upload-failure';

export type SignedUploadByteProgress = {
  loaded: number;
  total: number;
  /** Null when the browser cannot report a determinate total. */
  percent: number | null;
};

export type SignedUploadTransportResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      failureClass: UploadFailureClass;
      cancelled?: boolean;
    };

const DEFAULT_CACHE_CONTROL = '3600';

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/**
 * Production signed URLs must use HTTPS. A same-origin HTTP loopback URL is
 * accepted only for local browser E2E, where Playwright intercepts the request.
 */
export function isAllowedSignedUploadUrl(
  signedUrl: string,
  currentOrigin = typeof window !== 'undefined' ? window.location.origin : undefined,
): boolean {
  let uploadUrl: URL;
  try {
    uploadUrl = new URL(signedUrl);
  } catch {
    return false;
  }

  if (uploadUrl.protocol === 'https:') {
    return true;
  }

  if (uploadUrl.protocol !== 'http:' || !currentOrigin) {
    return false;
  }

  try {
    const current = new URL(currentOrigin);
    return (
      current.protocol === 'http:' &&
      isLoopbackHostname(current.hostname) &&
      uploadUrl.origin === current.origin
    );
  } catch {
    return false;
  }
}

/**
 * Uploads a file to a Supabase signed-upload URL with truthful transfer progress.
 * Mirrors supabase-js Blob upload semantics (PUT FormData + x-upsert) without installing deps.
 */
export function uploadFileToSignedUrlWithProgress(input: {
  signedUrl: string;
  file: File;
  contentType: string;
  upsert?: boolean;
  cacheControl?: string;
  onProgress?: (progress: SignedUploadByteProgress) => void;
  signal?: AbortSignal;
}): Promise<SignedUploadTransportResult> {
  const { signedUrl, file, upsert = false, cacheControl = DEFAULT_CACHE_CONTROL } = input;

  if (!signedUrl || !isAllowedSignedUploadUrl(signedUrl)) {
    return Promise.resolve({
      ok: false,
      message: messageForUploadFailure('unknown'),
      failureClass: 'unknown',
    });
  }

  if (input.signal?.aborted) {
    return Promise.resolve({
      ok: false,
      message: messageForUploadFailure('cancelled'),
      failureClass: 'cancelled',
      cancelled: true,
    });
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    const settle = (result: SignedUploadTransportResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const onAbort = () => {
      xhr.abort();
    };

    if (input.signal) {
      input.signal.addEventListener('abort', onAbort, { once: true });
    }

    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('x-upsert', String(upsert));

    xhr.upload.onprogress = (event) => {
      if (!input.onProgress) return;
      if (event.lengthComputable && event.total > 0) {
        const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)));
        input.onProgress({ loaded: event.loaded, total: event.total, percent });
        return;
      }
      input.onProgress({ loaded: event.loaded, total: 0, percent: null });
    };

    xhr.onerror = () => {
      if (input.signal) input.signal.removeEventListener('abort', onAbort);
      settle({
        ok: false,
        message: messageForUploadFailure('network'),
        failureClass: 'network',
      });
    };

    xhr.onabort = () => {
      if (input.signal) input.signal.removeEventListener('abort', onAbort);
      settle({
        ok: false,
        message: messageForUploadFailure('cancelled'),
        failureClass: 'cancelled',
        cancelled: true,
      });
    };

    xhr.onload = () => {
      if (input.signal) input.signal.removeEventListener('abort', onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        settle({ ok: true });
        return;
      }
      const failure = classifyHttpUploadFailure(xhr.status);
      settle({
        ok: false,
        message: failure.message,
        failureClass: failure.failureClass,
      });
    };

    // Match supabase-js Blob upload: FormData with cacheControl + file body.
    const body = new FormData();
    body.append('cacheControl', cacheControl);
    body.append('', file, file.name);

    // contentType is enforced during signed-upload authorization; FormData sets multipart boundary.
    void input.contentType;
    xhr.send(body);
  });
}
