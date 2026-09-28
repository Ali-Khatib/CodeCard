'use client';

import { useRouter } from 'next/navigation';
import { InboundScanOffers } from '@/components/dashboard/inbound-scan-offers';
import type { ScanOfferCard } from '@/lib/connections/scan-offers-core';

export function HomeScanOffers({ initialOffers }: { initialOffers: ScanOfferCard[] }) {
  const router = useRouter();
  return (
    <InboundScanOffers
      initialOffers={initialOffers}
      className="cc-app-page cc-app-page--1040 pb-0"
      onAccepted={(connectionId) => {
        router.push(`/dashboard/connections?details=${connectionId}`);
      }}
    />
  );
}
