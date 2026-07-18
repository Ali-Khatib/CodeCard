import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mockRequireAdmin = vi.fn();
const mockHide = vi.fn();
const mockRevalidateProfile = vi.fn();
const mockRevalidateProject = vi.fn();

vi.mock('@/lib/security/admin-api-authorization', () => ({
  requireGlobalAdminApiAccess: (...args: unknown[]) => mockRequireAdmin(...args),
}));

vi.mock('@/lib/admin/content-hiding', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/admin/content-hiding')>();
  return {
    ...actual,
    hideReportedContent: (...args: unknown[]) => mockHide(...args),
  };
});

vi.mock('@/lib/profile/public-cache', () => ({
  revalidatePublicProfile: (...args: unknown[]) => mockRevalidateProfile(...args),
  revalidatePublicProject: (...args: unknown[]) => mockRevalidateProject(...args),
}));

const actorUserId = '11111111-1111-4111-8111-111111111111';
const reportId = '22222222-2222-4222-8222-222222222222';
const targetId = '33333333-3333-4333-8333-333333333333';

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://codecard.app/api/admin/content/hide', {
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

const validBody = { reportId, targetType: 'project', targetId };

describe('POST /api/admin/content/hide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ ok: true, userId: actorUserId });
    mockHide.mockResolvedValue({
      ok: true,
      outcome: 'updated',
      targetType: 'project',
      targetId,
      profileSlug: 'owner-profile',
      isPublic: false,
      auditInserted: true,
    });
  });

  it.each([
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
  ])('rejects unauthorized callers with %s before hiding or auditing', async (status, message) => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: Response.json({ error: message }, { status }),
    });

    const response = await POST(request(validBody));

    expect(response.status).toBe(status);
    expect(mockHide).not.toHaveBeenCalled();
  });

  it('rejects cross-origin requests before mutation', async () => {
    const response = await POST(
      request(validBody, {
        origin: 'https://evil.example',
        'sec-fetch-site': 'cross-site',
      }),
    );

    expect(response.status).toBe(403);
    expect(mockHide).not.toHaveBeenCalled();
  });

  it.each([
    [{ ...validBody, targetType: 'research' }, 'unsupported target'],
    [{ ...validBody, targetType: 'media' }, 'unsupported media target'],
    [{ ...validBody, targetId: 'missing' }, 'invalid target'],
    [{ ...validBody, reportId: 'missing' }, 'invalid report'],
    [{ ...validBody, actorUserId: 'caller-controlled' }, 'caller actor'],
    [{ ...validBody, table: 'profiles' }, 'arbitrary table'],
  ])('rejects %s (%s)', async (body, label) => {
    expect(label).toBeTruthy();
    const response = await POST(request(body));

    expect(response.status).toBe(422);
    expect(mockHide).not.toHaveBeenCalled();
  });

  it('hides a project using the authorized actor and invalidates public cache', async () => {
    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect(mockHide).toHaveBeenCalledWith({
      actorUserId,
      reportId,
      targetType: 'project',
      targetId,
    });
    expect(mockRevalidateProject).toHaveBeenCalledWith('owner-profile', targetId);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      outcome: 'updated',
      targetType: 'project',
      targetId,
      isPublic: false,
    });
  });

  it('invalidates the profile route for profile hides', async () => {
    mockHide.mockResolvedValue({
      ok: true,
      outcome: 'idempotent',
      targetType: 'profile',
      targetId,
      profileSlug: 'owner-profile',
      isPublic: false,
      auditInserted: false,
    });

    const response = await POST(
      request({ reportId, targetType: 'profile', targetId }),
    );

    expect(response.status).toBe(200);
    expect(mockRevalidateProfile).toHaveBeenCalledWith('owner-profile');
  });

  it.each([
    ['report_not_found', 404],
    ['target_not_found', 404],
    ['target_mismatch', 409],
    ['conflict', 409],
    ['service_unavailable', 500],
  ] as const)('maps %s to a safe %s response', async (reason, status) => {
    mockHide.mockResolvedValue({ ok: false, reason });

    const response = await POST(request(validBody));
    const body = await response.json();

    expect(response.status).toBe(status);
    expect(JSON.stringify(body)).not.toMatch(/Supabase|PostgREST|SQL|report body/i);
    expect(mockRevalidateProject).not.toHaveBeenCalled();
  });
});
