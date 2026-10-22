import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as postResearch } from './route';

const mockGetUser = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/research/research-create-core', () => ({
  executeCreateResearch: vi.fn(),
}));

vi.mock('@/lib/research/research-update-core', () => ({
  executeUpdateResearch: (...args: unknown[]) => mockUpdate(...args),
}));

vi.mock('@/lib/research/research-revalidate', () => ({
  revalidateOwnedResearchPaths: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('POST /api/research', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', app_metadata: {} } },
    });
    mockUpdate.mockResolvedValue({
      success: true,
      researchPaperId: 'paper-1',
      slug: 'paper',
      previousSlug: 'paper',
      profileSlug: 'alex',
      isPublished: false,
    });
  });

  it('rejects a signed-out caller', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const body = new FormData();
    const response = await postResearch(
      new Request('https://codecard.app/api/research?op=update', {
        method: 'POST',
        headers: {
          origin: 'https://codecard.app',
          'sec-fetch-site': 'same-origin',
        },
        body,
      }),
    );
    expect(response.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns the saved paper without the owner slug', async () => {
    const body = new FormData();
    body.set('title', 'Paper');
    const response = await postResearch(
      new Request('https://codecard.app/api/research?op=update', {
        method: 'POST',
        headers: {
          origin: 'https://codecard.app',
          'sec-fetch-site': 'same-origin',
        },
        body,
      }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.researchPaperId).toBe('paper-1');
    expect(json.profileSlug).toBeUndefined();
  });
});
