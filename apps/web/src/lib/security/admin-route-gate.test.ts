import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * WS11-T002 — behavior tests for the `/admin` server route gate.
 * `forbidden()` / `redirect()` are mocked as throwing control-flow errors
 * with Next-style digests, matching production semantics.
 */

class MockRedirectError extends Error {
  digest: string;
  constructor(public url: string) {
    super(`NEXT_REDIRECT:${url}`);
    this.digest = `NEXT_REDIRECT;replace;${url};307;`;
  }
}

class MockForbiddenError extends Error {
  digest = 'NEXT_HTTP_ERROR_FALLBACK;403';
  constructor() {
    super('NEXT_HTTP_ERROR_FALLBACK;403');
  }
}

const mockGetUser = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new MockRedirectError(url);
  }),
  forbidden: vi.fn(() => {
    throw new MockForbiddenError();
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

import { createClient } from '@/lib/supabase/server';
import { enforceGlobalAdminAccess } from './admin-route-gate';

function sessionUser(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      user: {
        id: 'user-1',
        app_metadata: {},
        user_metadata: {},
        ...overrides,
      },
    },
    error: null,
  };
}

async function expectForbidden() {
  await expect(enforceGlobalAdminAccess()).rejects.toThrow(
    'NEXT_HTTP_ERROR_FALLBACK;403',
  );
}

async function expectSignInRedirect() {
  await expect(enforceGlobalAdminAccess()).rejects.toMatchObject({
    url: '/sign-in?redirect=%2Fadmin',
  });
}

beforeEach(() => {
  mockGetUser.mockReset();
  vi.mocked(createClient).mockClear();
});

describe('WS11-T002 /admin route gate', () => {
  it('redirects anonymous requests to sign-in (missing session)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { name: 'AuthSessionMissingError', message: 'Auth session missing!' },
    });
    await expectSignInRedirect();
  });

  it('redirects when no user is returned without an error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expectSignInRedirect();
  });

  it('uses a fixed sanitized internal return destination (no open redirect)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    try {
      await enforceGlobalAdminAccess();
      expect.unreachable('gate must not continue');
    } catch (error) {
      const url = (error as MockRedirectError).url;
      expect(url.startsWith('/sign-in?redirect=')).toBe(true);
      const target = decodeURIComponent(url.split('redirect=')[1]);
      expect(target).toBe('/admin');
      expect(target.startsWith('/')).toBe(true);
      expect(target).not.toContain('//');
      expect(target).not.toContain('://');
    }
  });

  it('forbids an ordinary authenticated user', async () => {
    mockGetUser.mockResolvedValue(sessionUser());
    await expectForbidden();
  });

  it('forbids a tenant admin without the global claim', async () => {
    mockGetUser.mockResolvedValue(
      sessionUser({
        app_metadata: {},
        tenant_role: 'admin',
        tenantRole: 'admin',
      }),
    );
    await expectForbidden();
  });

  it('forbids user_metadata.role = admin', async () => {
    mockGetUser.mockResolvedValue(
      sessionUser({ user_metadata: { role: 'admin' } }),
    );
    await expectForbidden();
  });

  it('forbids caller-supplied top-level role fields', async () => {
    mockGetUser.mockResolvedValue(sessionUser({ role: 'admin' }));
    await expectForbidden();
  });

  it('forbids similar role strings', async () => {
    for (const role of ['Admin', 'ADMIN', 'administrator', 'admins']) {
      mockGetUser.mockResolvedValue(sessionUser({ app_metadata: { role } }));
      await expectForbidden();
    }
  });

  it('forbids malformed app metadata (fails closed)', async () => {
    for (const appMetadata of [
      { role: ['admin'] },
      { role: 1 },
      { role: { name: 'admin' } },
      ['admin'],
    ]) {
      mockGetUser.mockResolvedValue(sessionUser({ app_metadata: appMetadata }));
      await expectForbidden();
    }
  });

  it('forbids missing app metadata', async () => {
    mockGetUser.mockResolvedValue(sessionUser({ app_metadata: undefined }));
    await expectForbidden();
  });

  it('allows the exact canonical global admin claim', async () => {
    mockGetUser.mockResolvedValue(sessionUser({ app_metadata: { role: 'admin' } }));
    await expect(enforceGlobalAdminAccess()).resolves.toEqual({
      authorized: true,
      reason: 'global_admin',
    });
  });

  it('fails closed when the identity provider errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { name: 'AuthRetryableFetchError', message: 'fetch failed' },
    });
    await expectForbidden();
    errorSpy.mockRestore();
  });

  it('fails closed when identity verification throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetUser.mockRejectedValue(new Error('network down'));
    await expectForbidden();
    errorSpy.mockRestore();
  });

  it('fails closed when client creation throws (auth unconfigured)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(createClient).mockRejectedValueOnce(new Error('supabaseUrl is required'));
    await expectForbidden();
    errorSpy.mockRestore();
  });

  it('logs no metadata, tokens, or user IDs on failure paths', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetUser.mockRejectedValue(new Error('secret-token-abc'));
    await expectForbidden();
    const logged = errorSpy.mock.calls.flat().join(' ');
    expect(logged).not.toContain('secret-token-abc');
    expect(logged).not.toContain('user-1');
    errorSpy.mockRestore();
  });
});
