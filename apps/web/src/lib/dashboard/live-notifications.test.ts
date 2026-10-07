import { describe, expect, it } from 'vitest';
import {
  formatNotificationTime,
  scanOffersToNotifications,
} from '@/lib/dashboard/live-notifications';
import type { ScanOfferCard } from '@/lib/connections/scan-offers-core';

const offer: ScanOfferCard = {
  id: 'offer-1',
  scannerProfileId: 'scanner-1',
  scannerName: 'Ali Khatib',
  scannerHeadline: null,
  scannerSlug: 'li-hatib',
  scannerAvatarUrl: null,
  createdAt: '2026-10-07T18:00:00.000Z',
};

describe('live notifications', () => {
  it('maps pending scan offers into bell items', () => {
    const now = Date.parse('2026-10-07T18:30:00.000Z');
    const items = scanOffersToNotifications([offer], '/dashboard', now);

    expect(items).toEqual([
      {
        id: 'scan-offer-1',
        type: 'activity',
        title: 'Ali Khatib scanned your card',
        body: 'Accept to add them to Connections.',
        time: '30m ago',
        unread: true,
        href: '/dashboard/connections',
      },
    ]);
  });

  it('formats relative notification times', () => {
    const now = Date.parse('2026-10-07T18:00:00.000Z');
    expect(formatNotificationTime('2026-10-07T17:59:30.000Z', now)).toBe('Just now');
    expect(formatNotificationTime('2026-10-07T17:00:00.000Z', now)).toBe('1h ago');
    expect(formatNotificationTime('2026-10-06T18:00:00.000Z', now)).toBe('Yesterday');
  });
});
