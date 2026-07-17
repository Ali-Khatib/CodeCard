import { describe, expect, it, vi } from 'vitest';
import {
  isExactAccountDeletionConfirmation,
  messageForAccountDeletionFailure,
  requestAccountDeletion,
} from './account-deletion-client';
import { ACCOUNT_DELETION_CONFIRMATION } from './delete-schema';

describe('account deletion client', () => {
  it('requires exact DELETE confirmation', () => {
    expect(isExactAccountDeletionConfirmation(ACCOUNT_DELETION_CONFIRMATION)).toBe(true);
    expect(isExactAccountDeletionConfirmation('delete')).toBe(false);
    expect(isExactAccountDeletionConfirmation('Delete')).toBe(false);
    expect(isExactAccountDeletionConfirmation('DELETE ')).toBe(false);
    expect(isExactAccountDeletionConfirmation(' DELETE')).toBe(false);
  });

  it('maps readiness and reauth failures safely', () => {
    expect(messageForAccountDeletionFailure('ACCOUNT_DELETION_NOT_READY')).toMatch(
      /not been deleted or changed/i,
    );
    expect(messageForAccountDeletionFailure('REAUTHENTICATION_REQUIRED')).toMatch(
      /reauthenticate/i,
    );
    expect(messageForAccountDeletionFailure('INVALID_CONFIRMATION')).toMatch(/DELETE/);
  });

  it('rejects invalid confirmation before calling the network', async () => {
    const fetchImpl = vi.fn();
    const result = await requestAccountDeletion({
      confirmation: 'delete',
      reauthentication: { method: 'recent_login' },
      fetchImpl: fetchImpl as never,
    });
    expect(result.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts the exact schema without a client-selected user id', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await requestAccountDeletion({
      confirmation: 'DELETE',
      reauthentication: { method: 'recent_login' },
      fetchImpl: fetchImpl as never,
    });

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const call = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const [url, init] = call;
    expect(url).toBe('/api/account/delete');
    expect(init).toMatchObject({
      method: 'POST',
      credentials: 'same-origin',
    });
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      confirmation: 'DELETE',
      reauthentication: { method: 'recent_login' },
    });
    expect(body).not.toHaveProperty('userId');
    expect(body).not.toHaveProperty('user_id');
  });

  it('maps ACCOUNT_DELETION_NOT_READY without claiming success', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: 'Account deletion is not available yet.',
          code: 'ACCOUNT_DELETION_NOT_READY',
        }),
        { status: 503 },
      ),
    );
    const result = await requestAccountDeletion({
      confirmation: 'DELETE',
      reauthentication: { method: 'recent_login' },
      fetchImpl: fetchImpl as never,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('ACCOUNT_DELETION_NOT_READY');
      expect(result.message).toMatch(/has not been deleted or changed/i);
    }
  });

  it('treats network interruption as a safe failure', async () => {
    const result = await requestAccountDeletion({
      confirmation: 'DELETE',
      reauthentication: { method: 'recent_login' },
      fetchImpl: vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }) as never,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/not deleted/i);
  });
});
