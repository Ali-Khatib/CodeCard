import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUT } from './route';

const mockRequireAdmin = vi.fn();
const mockUpdateNote = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock('@/lib/security/admin-api-authorization', () => ({
  requireGlobalAdminApiAccess: (...args: unknown[]) => mockRequireAdmin(...args),
}));

vi.mock('@/lib/admin/moderation-notes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/admin/moderation-notes')>();
  return {
    ...actual,
    updateModerationNote: (...args: unknown[]) => mockUpdateNote(...args),
  };
});

const actorUserId = '11111111-1111-4111-8111-111111111111';
const reportId = '22222222-2222-4222-8222-222222222222';
const expectedUpdatedAt = '2026-07-18T00:00:00.000Z';

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://codecard.app/api/admin/reports/${reportId}/note`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      origin: 'https://codecard.app',
      'sec-fetch-site': 'same-origin',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('PUT /api/admin/reports/[id]/note', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ ok: true, userId: actorUserId });
    mockUpdateNote.mockResolvedValue({
      ok: true,
      outcome: 'updated',
      notePresent: true,
      noteLength: 13,
      updatedAt: '2026-07-18T00:01:00.000Z',
      auditInserted: true,
    });
  });

  it.each([
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
  ])('rejects unauthorized callers with %s before reading or writing notes', async (status, error) => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: Response.json({ error }, { status }),
    });

    const response = await PUT(request({ note: 'private', expectedUpdatedAt }), {
      params: Promise.resolve({ id: reportId }),
    });
    expect(response.status).toBe(status);
    expect(mockUpdateNote).not.toHaveBeenCalled();
  });

  it('rejects CSRF before mutation', async () => {
    const response = await PUT(
      request(
        { note: 'private', expectedUpdatedAt },
        { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' },
      ),
      { params: Promise.resolve({ id: reportId }) },
    );
    expect(response.status).toBe(403);
    expect(mockUpdateNote).not.toHaveBeenCalled();
  });

  it.each([
    [{ note: 'x'.repeat(4001), expectedUpdatedAt }, 'oversized'],
    [{ note: 'private', expectedUpdatedAt, actorUserId: 'caller' }, 'caller actor'],
    [{ note: 'private', expectedUpdatedAt: 'not-a-date' }, 'invalid version'],
  ])('rejects invalid note payload: %s (%s)', async (body, label) => {
    expect(label).toBeTruthy();
    const response = await PUT(request(body), {
      params: Promise.resolve({ id: reportId }),
    });
    expect(response.status).toBe(422);
    expect(mockUpdateNote).not.toHaveBeenCalled();
  });

  it('updates through the authorized actor and returns no note body', async () => {
    const response = await PUT(
      request({ note: '<script>alert(1)</script>', expectedUpdatedAt }),
      { params: Promise.resolve({ id: reportId }) },
    );

    expect(response.status).toBe(200);
    expect(mockUpdateNote).toHaveBeenCalledWith({
      actorUserId,
      reportId,
      note: '<script>alert(1)</script>',
      expectedUpdatedAt,
    });
    const body = await response.json();
    expect(body).toEqual({
      ok: true,
      outcome: 'updated',
      notePresent: true,
      noteLength: 13,
      updatedAt: '2026-07-18T00:01:00.000Z',
    });
    expect(JSON.stringify(body)).not.toContain('<script>');
  });

  it.each([
    ['not_found', 404],
    ['conflict', 409],
    ['too_large', 422],
    ['service_unavailable', 500],
  ] as const)('maps %s to a safe %s response', async (reason, status) => {
    mockUpdateNote.mockResolvedValue({ ok: false, reason });
    const response = await PUT(request({ note: 'private', expectedUpdatedAt }), {
      params: Promise.resolve({ id: reportId }),
    });
    expect(response.status).toBe(status);
    expect(JSON.stringify(await response.json())).not.toMatch(/private|postgres|supabase/i);
  });
});
