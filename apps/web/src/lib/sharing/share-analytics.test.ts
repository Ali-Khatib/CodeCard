import { describe, expect, it, vi, afterEach } from 'vitest';
import { trackProfileShareEvent, trackQrDownloadEvent } from './share-analytics';

vi.mock('@codecard/analytics', () => ({
  isAnalyticsResourceId: (id: string | undefined) =>
    Boolean(id && /^[0-9a-f-]{36}$/i.test(id)),
  createSessionId: () => 'session-test',
  trackEvent: vi.fn(async () => undefined),
}));

import { trackEvent } from '@codecard/analytics';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';

describe('WS07-T007 share/QR analytics helpers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('emits profile_share with method metadata for copy and native share', async () => {
    await trackProfileShareEvent(PROFILE_ID, 'copy');
    await trackProfileShareEvent(PROFILE_ID, 'native_share');

    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenNthCalledWith(1, '/api/analytics', {
      event_type: 'profile_share',
      profile_id: PROFILE_ID,
      target_type: 'profile',
      target_id: PROFILE_ID,
      session_id: 'session-test',
      metadata: { method: 'copy' },
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, '/api/analytics', {
      event_type: 'profile_share',
      profile_id: PROFILE_ID,
      target_type: 'profile',
      target_id: PROFILE_ID,
      session_id: 'session-test',
      metadata: { method: 'native_share' },
    });
  });

  it('emits qr_download without destination or file payload', async () => {
    await trackQrDownloadEvent(PROFILE_ID);
    expect(trackEvent).toHaveBeenCalledWith('/api/analytics', {
      event_type: 'qr_download',
      profile_id: PROFILE_ID,
      target_type: 'profile',
      target_id: PROFILE_ID,
      session_id: 'session-test',
    });
  });

  it('skips emission for invalid or missing profile ids', async () => {
    await trackProfileShareEvent(undefined, 'copy');
    await trackProfileShareEvent('not-a-uuid', 'copy');
    await trackQrDownloadEvent(null);
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
