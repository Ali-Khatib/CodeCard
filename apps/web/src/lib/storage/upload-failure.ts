export type UploadFailureClass =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'upload_authorization'
  | 'rate_limited'
  | 'service_unavailable'
  | 'network'
  | 'signed_upload_expired'
  | 'finalization'
  | 'persistence'
  | 'cleanup_warning'
  | 'cancelled'
  | 'unknown';

export type UploadFailureInfo = {
  failureClass: UploadFailureClass;
  message: string;
  retryable: boolean;
};

const MESSAGES = {
  unsupportedType: 'This file type is not supported.',
  tooLarge: 'The file is too large.',
  sessionExpired: 'Your session expired. Sign in and try again.',
  interrupted: 'The upload was interrupted. Try again.',
  authzFailed: 'You do not have permission to upload this file.',
  rateLimited: 'You have uploaded too many files this hour. Try again later.',
  unavailable: 'Photo upload is temporarily unavailable. Try again shortly.',
  signedExpired: 'The upload authorization expired. Try again.',
  finalizeFailed: 'The upload finished, but saving it failed. Try again.',
  generic: 'Could not upload image. Please try again.',
  cancelled: 'Upload cancelled.',
  cleanupWarning: 'The file was replaced, but cleanup of the previous file is still pending.',
} as const;

export function messageForUploadFailure(failureClass: UploadFailureClass, fallback?: string): string {
  switch (failureClass) {
    case 'validation':
      return fallback ?? MESSAGES.unsupportedType;
    case 'authentication':
      return MESSAGES.sessionExpired;
    case 'authorization':
      return MESSAGES.authzFailed;
    case 'rate_limited':
      return MESSAGES.rateLimited;
    case 'service_unavailable':
      return fallback ?? MESSAGES.unavailable;
    case 'upload_authorization':
      return fallback ?? MESSAGES.generic;
    case 'network':
      return MESSAGES.interrupted;
    case 'signed_upload_expired':
      return MESSAGES.signedExpired;
    case 'finalization':
    case 'persistence':
      return fallback ?? MESSAGES.finalizeFailed;
    case 'cleanup_warning':
      return MESSAGES.cleanupWarning;
    case 'cancelled':
      return MESSAGES.cancelled;
    default:
      return fallback ?? MESSAGES.generic;
  }
}

export function classifyHttpUploadFailure(status: number): UploadFailureInfo {
  if (status === 401) {
    return {
      failureClass: 'authentication',
      message: messageForUploadFailure('authentication'),
      retryable: false,
    };
  }
  if (status === 403) {
    return {
      failureClass: 'authorization',
      message: messageForUploadFailure('authorization'),
      retryable: false,
    };
  }
  if (status === 404 || status === 410) {
    return {
      failureClass: 'signed_upload_expired',
      message: messageForUploadFailure('signed_upload_expired'),
      retryable: true,
    };
  }
  return {
    failureClass: 'network',
    message: messageForUploadFailure('network'),
    retryable: true,
  };
}

function safeClientMessage(bodyError: string | undefined, fallback: string): string {
  if (!bodyError) return fallback;
  if (/redis|upstash|token|stack|sql|supabase/i.test(bodyError)) return fallback;
  return bodyError;
}

export function classifyInitFailure(
  status: number,
  bodyError?: string,
  code?: string,
): UploadFailureInfo {
  if (status === 429 || code === 'rate_limited') {
    return {
      failureClass: 'rate_limited',
      message: messageForUploadFailure('rate_limited'),
      retryable: true,
    };
  }
  if (status === 503 || code === 'upload_unavailable') {
    return {
      failureClass: 'service_unavailable',
      message: safeClientMessage(bodyError, messageForUploadFailure('service_unavailable')),
      retryable: true,
    };
  }
  if (status === 401) {
    return {
      failureClass: 'authentication',
      message: messageForUploadFailure('authentication'),
      retryable: false,
    };
  }
  if (status === 403) {
    return {
      failureClass: 'authorization',
      message: bodyError && bodyError !== 'Forbidden'
        ? bodyError
        : messageForUploadFailure('authorization'),
      retryable: false,
    };
  }
  if (bodyError && bodyError !== 'Forbidden') {
    return {
      failureClass: 'upload_authorization',
      message: bodyError,
      retryable: true,
    };
  }
  return {
    failureClass: 'upload_authorization',
    message: messageForUploadFailure('upload_authorization'),
    retryable: true,
  };
}

export function isRetryableUploadFailure(failureClass: UploadFailureClass): boolean {
  return (
    failureClass === 'network' ||
    failureClass === 'signed_upload_expired' ||
    failureClass === 'upload_authorization' ||
    failureClass === 'rate_limited' ||
    failureClass === 'service_unavailable' ||
    failureClass === 'finalization' ||
    failureClass === 'persistence' ||
    failureClass === 'cancelled'
  );
}
