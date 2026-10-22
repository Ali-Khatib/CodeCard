import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as postLink } from './route';

const mockGetUser = vi.fn();
const mockCreate = vi.fn();
const mockResolve = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/profile/profile-link-core', () => ({
  executeCreateProfileLink: (...args: unknown[]) => mockCreate(...args),
  executeUpdateProfileLink: vi.fn(),
  executeDeleteProfileLink: vi.fn(),
  executeMoveProfileLink: vi.fn(),
}));

vi.mock('@/lib/profile/profile-auth-core', () => ({
  resolveOwnedProfile: (...args: unknown[]) => mockResolve(...args),
}));

vi.mock('@/lib/profile/public-cache', () => ({
  revalidatePublicProfile: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

function makeRequest(url = 'https://codecard.app/api/profile/links?op=create', headers: Record<string, string> = {}) {
  const body = new FormData();
  body.set('type', 'website');
  body.set('url', 'https://example.com');
  return new Request(url, {
    method: 'POST',
    headers: {
      origin: 'https://codecard.app',
      'sec-fetch-site': 'same-origin',
      ...headers,
    },
    body,
  });
}

describe('POST /api/profile/links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', app_metadata: {} } },
    });
    mockCreate.mockResolvedValue({
      success: true,
      link: { id: 'link-1', type: 'website', label: null, url: 'https://example.com', sort_order: 0 },
    });
    mockResolve.mockResolvedValue({
      profile: { id: 'profile-1', slug: 'alex', tenant_id: 't', owner_user_id: 'user-1', is_public: true },
    });
  });

  it('rejects a cross-site cookie mutation before any write', async () => {
    const response = await postLink(
      makeRequest('https://codecard.app/api/profile/links?op=create', {
        origin: 'https://evil.example',
        'sec-fetch-site': 'cross-site',
      }),
    );
    expect(response.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns the saved link without rendering the dashboard', async () => {
    const response = await postLink(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.link.id).toBe('link-1');
    expect(mockCreate).toHaveBeenCalled();
  });
});
