import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mockGetUser = vi.fn();
const mockExecute = vi.fn();
const mockRevalidate = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/profile/profile-update-core', () => ({
  executeProfileUpdate: (...args: unknown[]) => mockExecute(...args),
}));

vi.mock('@/lib/profile/profile-update-revalidate', () => ({
  revalidateOwnedProfileCaches: (...args: unknown[]) => mockRevalidate(...args),
}));

function makeRequest(headers: Record<string, string> = {}) {
  const body = new FormData();
  body.set('display_name', 'Alex Chen');
  body.set('slug', 'alex-chen');
  return new Request('https://codecard.app/api/profile', {
    method: 'POST',
    headers: {
      origin: 'https://codecard.app',
      'sec-fetch-site': 'same-origin',
      ...headers,
    },
    body,
  });
}

describe('POST /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', app_metadata: {} } },
    });
    mockExecute.mockResolvedValue({
      success: true,
      previousSlug: 'alex-chen',
      nextSlug: 'alex-chen',
      updatedAt: '2026-03-01T00:00:00.000Z',
      diagnostics: { authMs: 0, readMs: 4, writeMs: 6 },
    });
  });

  it('rejects a cross-site cookie mutation before any write', async () => {
    const response = await POST(
      makeRequest({ origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' }),
    );
    expect(response.status).toBe(403);
    expect(mockExecute).not.toHaveBeenCalled();
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it('rejects a signed-out caller', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('returns the confirmed write without dashboard diagnostics', async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      updatedAt: '2026-03-01T00:00:00.000Z',
    });
    expect(body.diagnostics).toBeUndefined();
    expect(mockRevalidate).toHaveBeenCalledWith({
      previousSlug: 'alex-chen',
      nextSlug: 'alex-chen',
    });
  });

  it('skips cache invalidation when nothing changed', async () => {
    mockExecute.mockResolvedValue({
      success: true,
      unchanged: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
      diagnostics: { authMs: 0, readMs: 3, writeMs: 0 },
    });
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it('does not report success when the write conflicts', async () => {
    mockExecute.mockResolvedValue({
      success: undefined,
      code: 'conflict',
      error: 'This profile was updated in another session. Reload the page, then save again.',
    });
    const response = await POST(makeRequest());
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(mockRevalidate).not.toHaveBeenCalled();
  });
});
