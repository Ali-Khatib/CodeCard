import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mockRateLimit = vi.fn();
const mockGetUser = vi.fn();
const mockSubmitReport = vi.fn();
const mockFingerprint = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/moderation/public-reporting', () => ({
  createReportSourceFingerprint: (...args: unknown[]) => mockFingerprint(...args),
  submitPublicReport: (...args: unknown[]) => mockSubmitReport(...args),
}));

const targetId = '11111111-1111-4111-8111-111111111111';
const reporterUserId = '22222222-2222-4222-8222-222222222222';

function request(body: unknown) {
  return new Request('https://codecard.app/api/moderation/report', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.4',
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  target_type: 'profile',
  target_id: targetId,
  reason_category: 'spam',
  description: '<script>alert(1)</script>',
};

describe('POST /api/moderation/report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockFingerprint.mockReturnValue('a'.repeat(64));
    mockSubmitReport.mockResolvedValue({ ok: true });
  });

  it('allows an anonymous visitor and returns no moderation oracle', async () => {
    const response = await POST(request(validBody));
    expect(response.status).toBe(200);
    expect(mockSubmitReport).toHaveBeenCalledWith({
      reporterUserId: null,
      targetType: 'profile',
      targetId,
      reasonCategory: 'spam',
      description: '<script>alert(1)</script>',
      sourceFingerprint: 'a'.repeat(64),
    });
    await expect(response.json()).resolves.toEqual({
      ok: true,
      status: 'accepted',
    });
  });

  it('associates an authenticated reporter from verified Auth only', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: reporterUserId } } });
    const response = await POST(request({ ...validBody, target_type: 'project' }));
    expect(response.status).toBe(200);
    expect(mockFingerprint).toHaveBeenCalledWith({
      ip: '203.0.113.4',
      reporterUserId,
    });
    expect(mockSubmitReport).toHaveBeenCalledWith(
      expect.objectContaining({ reporterUserId, targetType: 'project' }),
    );
  });

  it.each([
    [{ ...validBody, target_type: 'research' }, 'unsupported research'],
    [{ ...validBody, target_type: 'media' }, 'unsupported media'],
    [{ ...validBody, target_id: 'not-a-uuid' }, 'invalid target'],
    [{ ...validBody, reason_category: 'made-up' }, 'invalid reason'],
    [{ ...validBody, description: 'x'.repeat(1501) }, 'oversized description'],
    [{ ...validBody, owner_id: reporterUserId }, 'caller owner'],
    [{ ...validBody, target_id_override: reporterUserId }, 'target substitution'],
  ])('rejects invalid input: %s (%s)', async (body, label) => {
    expect(label).toBeTruthy();
    const response = await POST(request(body));
    expect(response.status).toBe(422);
    expect(mockSubmitReport).not.toHaveBeenCalled();
  });

  it('returns 429 before storage when the shared limiter rejects', async () => {
    mockRateLimit.mockResolvedValue({ success: false });
    const response = await POST(request(validBody));
    expect(response.status).toBe(429);
    expect(mockSubmitReport).not.toHaveBeenCalled();
  });

  it('uses a generic response for missing or private targets', async () => {
    mockSubmitReport.mockResolvedValue({ ok: false, reason: 'target_unavailable' });
    const response = await POST(request(validBody));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'Content is unavailable' });
    expect(JSON.stringify(body)).not.toMatch(/private|report count|moderation status/i);
  });

  it('keeps storage failures opaque and creates no admin audit event', async () => {
    mockSubmitReport.mockResolvedValue({ ok: false, reason: 'service_unavailable' });
    const response = await POST(request(validBody));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toMatch(/supabase|sql|audit/i);
  });
});
