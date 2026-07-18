import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from './route';

const mockRequireAdmin = vi.fn();
const mockTransition = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock('@/lib/security/admin-api-authorization', () => ({
  requireGlobalAdminApiAccess: (...args: unknown[]) => mockRequireAdmin(...args),
}));

vi.mock('@/lib/admin/moderation-actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/admin/moderation-actions')>();
  return {
    ...actual,
    transitionModerationReport: (...args: unknown[]) => mockTransition(...args),
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const reportId = '11111111-1111-4111-8111-111111111111';
const adminId = '22222222-2222-4222-8222-222222222222';

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://codecard.app/api/admin/reports/${reportId}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      origin: 'https://codecard.app',
      'sec-fetch-site': 'same-origin',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function context(id = reportId) {
  return { params: Promise.resolve({ id }) };
}

describe('PATCH /api/admin/reports/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ ok: true, userId: adminId });
    mockTransition.mockResolvedValue({
      ok: true,
      outcome: 'updated',
      status: 'resolved',
      auditInserted: true,
    });
  });

  it.each([
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
  ])('rejects unauthorized callers with %s before mutation', async (status, message) => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: Response.json({ error: message }, { status }),
    });

    const response = await PATCH(request({ action: 'resolve' }), context());

    expect(response.status).toBe(status);
    expect(mockTransition).not.toHaveBeenCalled();
  });

  it('enforces same-origin CSRF before mutation', async () => {
    const response = await PATCH(
      request(
        { action: 'resolve' },
        { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' },
      ),
      context(),
    );

    expect(response.status).toBe(403);
    expect(mockTransition).not.toHaveBeenCalled();
  });

  it('rejects invalid report IDs and actions', async () => {
    const invalidId = await PATCH(request({ action: 'resolve' }), context('not-a-uuid'));
    const invalidAction = await PATCH(request({ action: 'close' }), context());

    expect(invalidId.status).toBe(422);
    expect(invalidAction.status).toBe(422);
    expect(mockTransition).not.toHaveBeenCalled();
  });

  it.each([
    ['resolve', 'resolved'],
    ['dismiss', 'dismissed'],
  ] as const)('allows an authorized admin to %s and derives the audit actor', async (action, status) => {
    mockTransition.mockResolvedValue({
      ok: true,
      outcome: 'updated',
      status,
      auditInserted: true,
    });

    const response = await PATCH(
      request({ action, actorUserId: 'attacker-controlled-id', status: 'arbitrary' }),
      context(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      outcome: 'updated',
      status,
    });
    expect(mockTransition).toHaveBeenCalledWith({
      reportId,
      action,
      actorUserId: adminId,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('returns safe idempotent success for an identical retry', async () => {
    mockTransition.mockResolvedValue({
      ok: true,
      outcome: 'idempotent',
      status: 'resolved',
      auditInserted: false,
    });

    const response = await PATCH(request({ action: 'resolve' }), context());

    expect(response.status).toBe(200);
    expect((await response.json()).outcome).toBe('idempotent');
  });

  it.each([
    ['not_found', 404],
    ['conflict', 409],
    ['service_unavailable', 500],
  ] as const)('maps %s to a safe %s response', async (reason, status) => {
    mockTransition.mockResolvedValue({ ok: false, reason });

    const response = await PATCH(request({ action: 'dismiss' }), context());
    const body = await response.json();

    expect(response.status).toBe(status);
    expect(JSON.stringify(body)).not.toMatch(/PostgREST|Supabase|SQL|provider/i);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it('returns private no-store responses', async () => {
    const response = await PATCH(request({ action: 'resolve' }), context());
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
});
