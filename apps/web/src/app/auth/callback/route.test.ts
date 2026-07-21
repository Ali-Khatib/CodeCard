import { beforeEach, describe, expect, it, vi } from 'vitest';

const exchangeCodeForSession = vi.fn();
const createClient = vi.fn(async () => ({
  auth: { exchangeCodeForSession },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => createClient(),
}));

vi.mock('@/lib/auth/configured', () => ({
  isAuthConfigured: () => true,
}));

describe('GET /auth/callback', () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    createClient.mockClear();
  });

  it('exchanges a valid code and redirects to a safe internal path', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import('@/app/auth/callback/route');

    const response = await GET(
      new Request('https://codecard-mvp.vercel.app/auth/callback?code=ok-code&redirect=/dashboard'),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith('ok-code');
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://codecard-mvp.vercel.app/dashboard');
  });

  it('rejects unsafe external redirects after a successful exchange', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import('@/app/auth/callback/route');

    const response = await GET(
      new Request(
        'https://codecard-mvp.vercel.app/auth/callback?code=ok-code&redirect=https%3A%2F%2Fevil.example',
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://codecard-mvp.vercel.app/dashboard');
  });

  it('shows link_expired recovery for invalid or expired codes', async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: { message: 'Auth code expired' },
    });
    const { GET } = await import('@/app/auth/callback/route');

    const response = await GET(
      new Request('https://codecard-mvp.vercel.app/auth/callback?code=stale'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://codecard-mvp.vercel.app/auth/error?reason=link_expired',
    );
  });
});
