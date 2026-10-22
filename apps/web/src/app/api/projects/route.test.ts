import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as postProject } from './route';

const mockGetUser = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/projects/project-create-core', () => ({
  executeCreateProject: (...args: unknown[]) => mockCreate(...args),
}));

vi.mock('@/lib/projects/project-update-core', () => ({
  executeUpdateProject: (...args: unknown[]) => mockUpdate(...args),
}));

vi.mock('@/lib/projects/project-revalidate', () => ({
  revalidateOwnedProjectPaths: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

function makeRequest(op: string) {
  const body = new FormData();
  body.set('title', 'DevFlow');
  return new Request(`https://codecard.app/api/projects?op=${op}`, {
    method: 'POST',
    headers: {
      origin: 'https://codecard.app',
      'sec-fetch-site': 'same-origin',
    },
    body,
  });
}

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', app_metadata: {} } },
    });
    mockCreate.mockResolvedValue({
      success: true,
      projectId: 'project-1',
      redirectTo: '/dashboard/projects/project-1/edit',
    });
    mockUpdate.mockResolvedValue({
      success: true,
      projectId: 'project-1',
      profileSlug: 'alex',
      isPublished: false,
    });
  });

  it('returns the create result without profile internals', async () => {
    const response = await postProject(makeRequest('create'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      projectId: 'project-1',
      redirectTo: '/dashboard/projects/project-1/edit',
    });
    expect(body.profileSlug).toBeUndefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('saves an edit without echoing the public slug', async () => {
    const response = await postProject(makeRequest('update'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.projectId).toBe('project-1');
    expect(body.profileSlug).toBeUndefined();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
