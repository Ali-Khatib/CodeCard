import {
  ACCOUNT_DELETION_CONFIRMATION,
  type AccountDeletionErrorCode,
  type AccountDeletionReauthentication,
} from '@/lib/account/delete-schema';

export type AccountDeletionClientResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      code?: AccountDeletionErrorCode | 'NETWORK' | 'UNEXPECTED';
      status?: number;
    };

const SAFE_MESSAGES: Record<string, string> = {
  INVALID_CONFIRMATION: 'Type DELETE exactly to confirm. Your account was not deleted.',
  UNAUTHENTICATED: 'Your session has expired. Please sign in again.',
  REAUTHENTICATION_REQUIRED:
    'Please reauthenticate, then try again. Your account was not deleted.',
  RATE_LIMITED: 'Too many deletion attempts. Please try again later. Your account was not deleted.',
  ACCOUNT_DELETION_NOT_READY:
    'Account deletion is temporarily unavailable because a required safety service is not ready. Your account has not been deleted or changed.',
  ACCOUNT_DELETION_IN_PROGRESS: 'Account deletion is already in progress. Please wait.',
  SHARED_TENANT_BLOCKED:
    'This account shares a workspace that cannot be deleted automatically. Your account was not deleted.',
  ACCOUNT_DELETION_FAILED:
    'We couldn’t complete account deletion. Your account was not deleted.',
  METHOD_NOT_ALLOWED: 'Account deletion is unavailable right now. Your account was not deleted.',
  FORBIDDEN_ORIGIN: 'This request was blocked for security. Your account was not deleted.',
  NETWORK: 'The request was interrupted. Your account was not deleted.',
  UNEXPECTED: 'Something went wrong. Your account was not deleted.',
};

export function isExactAccountDeletionConfirmation(value: string): boolean {
  return value === ACCOUNT_DELETION_CONFIRMATION;
}

export function messageForAccountDeletionFailure(
  code?: string | null,
  fallbackStatus?: number,
): string {
  if (code && SAFE_MESSAGES[code]) return SAFE_MESSAGES[code];
  if (fallbackStatus === 401) return SAFE_MESSAGES.UNAUTHENTICATED;
  if (fallbackStatus === 429) return SAFE_MESSAGES.RATE_LIMITED;
  if (fallbackStatus === 503) return SAFE_MESSAGES.ACCOUNT_DELETION_NOT_READY;
  return SAFE_MESSAGES.UNEXPECTED;
}

/**
 * Submit account deletion using the authenticated session.
 * Never sends a client-selected user id.
 */
export async function requestAccountDeletion(input: {
  confirmation: string;
  reauthentication: AccountDeletionReauthentication;
  fetchImpl?: typeof fetch;
}): Promise<AccountDeletionClientResult> {
  if (!isExactAccountDeletionConfirmation(input.confirmation)) {
    return { ok: false, code: 'INVALID_CONFIRMATION', message: SAFE_MESSAGES.INVALID_CONFIRMATION };
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const body = {
    confirmation: ACCOUNT_DELETION_CONFIRMATION,
    reauthentication: input.reauthentication,
  };

  let response: Response;
  try {
    response = await fetchImpl('/api/account/delete', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, code: 'NETWORK', message: SAFE_MESSAGES.NETWORK };
  }

  if (!response.ok) {
    const parsed = (await response.json().catch(() => null)) as
      | { error?: string; code?: string }
      | null;
    const code = parsed?.code;
    return {
      ok: false,
      status: response.status,
      code: (code as AccountDeletionErrorCode | undefined) ?? 'UNEXPECTED',
      message: messageForAccountDeletionFailure(code, response.status),
    };
  }

  const parsed = (await response.json().catch(() => null)) as { success?: boolean } | null;
  if (!parsed?.success) {
    return { ok: false, code: 'UNEXPECTED', message: SAFE_MESSAGES.UNEXPECTED };
  }

  return { ok: true };
}
