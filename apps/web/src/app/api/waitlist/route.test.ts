import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mockRateLimit = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSend = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(async () => ({
    from: () => ({
      insert: mockInsert,
      update: mockUpdate,
    }),
  })),
}));

vi.mock('@/lib/waitlist/send-waitlist-confirmation', () => ({
  sendWaitlistConfirmationEmail: (...args: unknown[]) => mockSend(...args),
}));

function makeRequest(body: unknown) {
  return new Request('https://codecard.app/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/waitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockSend.mockResolvedValue(true);
    mockUpdate.mockReturnValue({
      eq: vi.fn(async () => ({ error: null })),
    });
  });

  it('inserts a new email and sends confirmation', async () => {
    mockInsert.mockReturnValue({
      select: () => ({
        maybeSingle: async () => ({ data: { id: 'abc' }, error: null }),
      }),
    });

    const response = await POST(makeRequest({ email: 'You@CodeCard.dev' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, status: 'joined' });
    expect(mockSend).toHaveBeenCalledWith('you@codecard.dev');
  });

  it('returns already for unique violations', async () => {
    mockInsert.mockReturnValue({
      select: () => ({
        maybeSingle: async () => ({ data: null, error: { code: '23505' } }),
      }),
    });

    const response = await POST(makeRequest({ email: 'you@codecard.dev' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, status: 'already' });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('drops honeypot submissions without writing', async () => {
    const response = await POST(
      makeRequest({ email: 'bot@codecard.dev', website: 'https://spam.test' }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, status: 'joined' });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
