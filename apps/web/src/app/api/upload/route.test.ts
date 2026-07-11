import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { POST } from './route';

const mockGetUser = vi.fn();
const mockCreateSignedUploadUrl = vi.fn();
const mockFrom = vi.fn();
const mockRateLimit = vi.fn();
const mockResolveOwnedProfile = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        createSignedUploadUrl: mockCreateSignedUploadUrl,
      })),
    },
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

vi.mock('@/lib/profile/profile-auth-core', () => ({
  resolveOwnedProfile: (...args: unknown[]) => mockResolveOwnedProfile(...args),
}));

const profile = {
  id: '33333333-3333-4333-8333-333333333333',
  tenant_id: '11111111-1111-4111-8111-111111111111',
  owner_user_id: '22222222-2222-4222-8222-222222222222',
  slug: 'alex',
  is_public: false,
};

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://codecard.app/api/upload', {
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

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockGetUser.mockResolvedValue({ data: { user: { id: profile.owner_user_id } } });
    mockResolveOwnedProfile.mockResolvedValue({ profile });
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: {
        signedUrl: 'https://storage.example/upload',
        token: 'upload-token',
        path: 'signed-path',
      },
      error: null,
    });
  });

  it('rejects unauthenticated requests', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await POST(
      makeRequest({
        resourceType: 'avatar',
        filename: 'avatar.png',
        mimeType: 'image/png',
        size: 1024,
      }),
    );

    expect(response.status).toBe(401);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it('rejects cross-origin mutation requests', async () => {
    const response = await POST(
      makeRequest(
        {
          resourceType: 'avatar',
          filename: 'avatar.png',
          mimeType: 'image/png',
          size: 1024,
        },
        { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' },
      ),
    );

    expect(response.status).toBe(403);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it('rejects invalid metadata before signing', async () => {
    const response = await POST(
      makeRequest({
        resourceType: 'avatar',
        filename: 'avatar.svg',
        mimeType: 'image/svg+xml',
        size: 100,
      }),
    );

    expect(response.status).toBe(415);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it('authorizes avatar uploads from the authenticated owner profile', async () => {
    const response = await POST(
      makeRequest({
        resourceType: 'avatar',
        filename: 'avatar.png',
        mimeType: 'image/png',
        size: 1024,
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.signedUrl).toBe('https://storage.example/upload');
    expect(body.token).toBe('upload-token');
    expect(body.path).toContain(profile.tenant_id);
    expect(body.path).toContain(profile.owner_user_id);
    expect(body.path).toContain('/avatar/');
    expect(body.maxBytes).toBe(5 * 1024 * 1024);
    expect(body.serviceRoleKey).toBeUndefined();
    expect(mockCreateSignedUploadUrl).toHaveBeenCalledTimes(1);
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const response = await POST(
      makeRequest({
        resourceType: 'avatar',
        filename: 'avatar.png',
        mimeType: 'image/png',
        size: 1024,
      }),
    );

    expect(response.status).toBe(429);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it('sets cache-control to no-store', async () => {
    const response = await POST(
      makeRequest({
        resourceType: 'avatar',
        filename: 'avatar.png',
        mimeType: 'image/png',
        size: 1024,
      }),
    );

    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});

describe('resolveUploadOwnership', () => {
  it('denies foreign project ownership', async () => {
    const { resolveUploadOwnership } = await import('@/lib/storage/upload-ownership');
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await resolveUploadOwnership(
      supabase,
      profile.owner_user_id,
      'project-media',
      '44444444-4444-4444-8444-444444444444',
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });
});
