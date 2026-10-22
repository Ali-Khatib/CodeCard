import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mockGetUser = vi.fn();
const mockCreate = vi.fn();
const mockRateLimit = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

vi.mock('@/lib/schedule/owner-events-core', () => ({
  executeCreateOwnerEvent: (...args: unknown[]) => mockCreate(...args),
  executeUpdateOwnerEvent: vi.fn(),
  executeDeleteOwnerEvent: vi.fn(),
  ownerEventErrorMessage: () => 'Could not update your calendar. Please try again.',
}));

function makeRequest() {
  const body = new FormData();
  body.set('title', 'DevConf SF hallway hours');
  body.set('startsAt', '2026-10-22T16:00:00.000Z');
  return new Request('https://codecard.app/api/schedule/events?op=create', {
    method: 'POST',
    headers: {
      origin: 'https://codecard.app',
      'sec-fetch-site': 'same-origin',
    },
    body,
  });
}

describe('POST /api/schedule/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', app_metadata: {} } },
    });
    mockRateLimit.mockResolvedValue({ success: true });
    mockCreate.mockResolvedValue({
      success: true,
      event: {
        id: 'event-1',
        title: 'DevConf SF hallway hours',
        location: null,
        startsAt: '2026-10-22T16:00:00.000Z',
        endsAt: null,
        notes: null,
      },
    });
  });

  it('returns the saved event without asking the calendar page to render', async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.event.id).toBe('event-1');
    expect(mockCreate).toHaveBeenCalled();
  });
});
