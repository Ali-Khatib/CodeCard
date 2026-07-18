import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireGlobalAdminApiAccess } from './admin-api-authorization';

const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

function verifiedUser(input: {
  id?: string;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown>;
}) {
  return {
    data: {
      user: {
        id: input.id ?? '11111111-1111-4111-8111-111111111111',
        app_metadata: input.app_metadata,
        user_metadata: input.user_metadata,
      },
    },
    error: null,
  };
}

describe('requireGlobalAdminApiAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for an anonymous request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await requireGlobalAdminApiAccess();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it('returns 403 for authenticated non-admin and tenant-admin identities', async () => {
    mockGetUser.mockResolvedValue(
      verifiedUser({ app_metadata: { tenant_role: 'admin' } }),
    );

    const result = await requireGlobalAdminApiAccess();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('does not authorize user_metadata.role', async () => {
    mockGetUser.mockResolvedValue(
      verifiedUser({
        app_metadata: {},
        user_metadata: { role: 'admin' },
      }),
    );

    const result = await requireGlobalAdminApiAccess();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('fails closed for malformed app metadata', async () => {
    mockGetUser.mockResolvedValue(verifiedUser({ app_metadata: { role: ['admin'] } }));

    const result = await requireGlobalAdminApiAccess();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('allows only the canonical app_metadata role and derives the user id', async () => {
    const id = '22222222-2222-4222-8222-222222222222';
    mockGetUser.mockResolvedValue(verifiedUser({ id, app_metadata: { role: 'admin' } }));

    await expect(requireGlobalAdminApiAccess()).resolves.toEqual({ ok: true, userId: id });
  });

  it('returns an opaque 500 when identity verification fails unexpectedly', async () => {
    mockGetUser.mockRejectedValue(new Error('provider details'));

    const result = await requireGlobalAdminApiAccess();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(500);
      await expect(result.response.json()).resolves.toEqual({
        error: 'Something went wrong. Please try again.',
      });
    }
  });
});
