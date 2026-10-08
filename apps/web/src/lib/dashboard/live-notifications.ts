import type { ScanOfferCard } from '@/lib/connections/scan-offers-core';
import type { DashboardNotification } from '@/lib/dashboard/notifications-demo';

export function formatNotificationTime(iso: string, now = Date.now()): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Just now';

  const deltaMs = Math.max(0, now - parsed.getTime());
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

export function scanOffersToNotifications(
  offers: ScanOfferCard[],
  basePath: string,
  now = Date.now(),
): DashboardNotification[] {
  return offers.map((offer) => ({
    id: `scan-${offer.id}`,
    type: 'activity',
    title: `${offer.scannerName} sent a connection request`,
    body: offer.scannerHeadline
      ? `${offer.scannerHeadline} — accept, refuse, or decide later.`
      : 'Accept, refuse, or decide later.',
    time: formatNotificationTime(offer.createdAt, now),
    unread: true,
    href: `scan:${offer.id}`,
  }));
}
