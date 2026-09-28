'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  acceptScanOfferAction,
  dismissScanOfferAction,
  listPendingScanOffersAction,
  type ScanOfferCard,
} from '@/app/actions/scan-offers';
import { AppButton, AppCard } from '@/components/dashboard/ui/dashboard-ui';

export function InboundScanOffers({
  initialOffers,
  onAccepted,
  className,
}: {
  initialOffers: ScanOfferCard[];
  onAccepted?: (connectionId: string, name: string) => void;
  className?: string;
}) {
  const [offers, setOffers] = useState(initialOffers);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setOffers(initialOffers);
  }, [initialOffers]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const result = await listPendingScanOffersAction();
      if (!cancelled && !result.error) setOffers(result.offers);
    };
    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const accept = useCallback(
    (offer: ScanOfferCard) => {
      if (pending) return;
      setError(null);
      setPendingId(offer.id);
      startTransition(async () => {
        const result = await acceptScanOfferAction(offer.id);
        setPendingId(null);
        if (!result.success || !result.connectionId) {
          setError(result.error ?? 'Could not add this Connection.');
          return;
        }
        setOffers((prev) => prev.filter((item) => item.id !== offer.id));
        onAccepted?.(result.connectionId, offer.scannerName);
      });
    },
    [pending, onAccepted],
  );

  const dismiss = useCallback(
    (offer: ScanOfferCard) => {
      if (pending) return;
      setError(null);
      setPendingId(offer.id);
      startTransition(async () => {
        const result = await dismissScanOfferAction(offer.id);
        setPendingId(null);
        if (!result.success) {
          setError(result.error ?? 'Could not dismiss this scan.');
          return;
        }
        setOffers((prev) => prev.filter((item) => item.id !== offer.id));
      });
    },
    [pending],
  );

  if (offers.length === 0 && !error) return null;

  return (
    <div className={`space-y-3 ${className ?? ''}`.trim()}>
      {offers.map((offer) => (
        <AppCard key={offer.id} className="!p-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--app-iris)]">
            Someone scanned your card
          </p>
          <h2 className="mt-2 text-[22px] font-medium tracking-[-0.03em] text-[var(--app-ink)]">
            {offer.scannerName} just scanned your card
          </h2>
          {offer.scannerHeadline ? (
            <p className="mt-1 text-[14px] text-[var(--app-smoke)]">{offer.scannerHeadline}</p>
          ) : null}
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--app-ink)]">
            Accept to add them to Connections. You can then save where you met, when, a note, and a follow-up.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AppButton
              variant="primary"
              onClick={() => accept(offer)}
              ariaLabel={`Accept and add ${offer.scannerName} to Connections`}
            >
              {pending && pendingId === offer.id ? 'Adding…' : 'Add connection'}
            </AppButton>
            <AppButton
              variant="ghost"
              onClick={() => dismiss(offer)}
              ariaLabel={`Dismiss scan from ${offer.scannerName}`}
            >
              Not now
            </AppButton>
          </div>
        </AppCard>
      ))}
      {error ? (
        <p className="text-[13px] text-[var(--app-danger,#b42318)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
