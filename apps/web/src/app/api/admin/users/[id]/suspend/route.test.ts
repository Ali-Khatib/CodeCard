import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mockRequireAdmin = vi.fn();
const mockSuspend = vi.fn();

vi.mock('@/lib/security/admin-api-authorization', () => ({
  requireGlobalAdminApiAccess: (...args: unknown[]) => mockRequireAdmin(...args),
}));

vi.mock('@/lib/admin/account-suspension', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/admin/account-suspension')>();
  return {
    ...actual,
    suspendAccount: (...args: unknown[]) => mockSuspend(...args),
  };
});

const actorUserId = '11111111-1111-4111-8111-111111111111';
const targetUserId = '22222222-2222-4222-8222-222222222222';
const reportId = '33333333-3333-4333-8333-333333333333';

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://codecard.app/api/admin/users/${targetUserId}/suspend`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://codecard.app',
      'sec-fetch-site': 'same-origin',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/users/[id]/suspend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ ok: true, userId: actorUserId });
    mockSuspend.mockResolvedValue({
      ok: true,
      outcome: 'updated',
      targetUserId,
      authSuspended: true,
      auditInserted: true,
    });
  });

  it.each([
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
  ])('rejects unauthorized callers with %s before suspension', async (status, message) => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: Response.json({ error: message }, { status }),
    });

    const response = await POST(request({ reportId }), {
      params: Promise.resolve({ id: targetUserId }),
    });

    expect(response.status).toBe(status);
    expect(mockSuspend).not.toHaveBeenCalled();
  });

  it('rejects cross-origin requests before mutation', async () => {
    const response = await POST(
      request(
        { reportId },
        { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' },
      ),
      { params: Promise.resolve({ id: targetUserId }) },
    );

    expect(response.status).toBe(403);
    expect(mockSuspend).not.toHaveBeenCalled();
  });

  it('rejects invalid target ids and caller-controlled actor fields', async () => {
    const invalid = await POST(request({ reportId }), {
      params: Promise.resolve({ id: 'not-a-uuid' }),
    });
    expect(invalid.status).toBe(404);
    expect(mockSuspend).not.toHaveBeenCalled();

    const withActor = await POST(request({ reportId, actorUserId: 'caller-controlled' }), {
      params: Promise.resolve({ id: targetUserId }),
    });
    expect(withActor.status).toBe(422);
    expect(mockSuspend).not.toHaveBeenCalled();
  });

  it('suspends using the authorized actor and path target id', async () => {
    const response = await POST(request({ reportId }), {
      params: Promise.resolve({ id: targetUserId }),
    });

    expect(response.status).toBe(200);
    expect(mockSuspend).toHaveBeenCalledWith({
      actorUserId,
      targetUserId,
      reportId,
    });
    await expect(response.json()).resolves.toEqual({
      ok: true,
      outcome: 'updated',
      targetUserId,
      suspended: true,
    });
  });

  it.each([
    ['target_not_found', 404],
    ['report_not_found', 404],
    ['self_suspension', 409],
    ['last_admin', 409],
    ['demo_identity', 409],
    ['service_identity', 409],
    ['target_mismatch', 409],
    ['auth_partial', 503],
    ['service_unavailable', 500],
  ] as const)('maps %s to a safe %s response', async (reason, status) => {
    mockSuspend.mockResolvedValue({ ok: false, reason });

    const response = await POST(request({ reportId }), {
      params: Promise.resolve({ id: targetUserId }),
    });
    const body = await response.json();

    expect(response.status).toBe(status);
    expect(JSON.stringify(body)).not.toMatch(/Supabase|Auth Admin|ban_duration|stripe/i);
  });
});
