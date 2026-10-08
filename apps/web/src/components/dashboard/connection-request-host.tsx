'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AUDIENCE_ROLE_LABELS, isAudienceRole } from '@codecard/validation';
import {
  acceptScanOfferAction,
  dismissScanOfferAction,
  finalizeAcceptedScanConnectionsAction,
  listPendingScanOffersAction,
  type ScanOfferCard,
} from '@/app/actions/scan-offers';
import { updateConnectionMetadataAction } from '@/app/actions/connection-metadata';
import { HandshakePortal } from '@/components/connections/handshake-portal';
import { IncomingCall } from '@/components/ui/card-16';
import { Button } from '@/components/ui/button';
import {
  clearScanOfferSnooze,
  isScanOfferSnoozed,
  snoozeScanOffer,
} from '@/lib/connections/scan-offer-snooze';
import { toDateInputValue } from '@/lib/schedule/datetime';

type Stage = 'alert' | 'decision' | 'details';

function roleLabel(role: string | null | undefined): string {
  if (role && isAudienceRole(role)) return AUDIENCE_ROLE_LABELS[role];
  return 'Someone';
}

function tomorrowIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateInputValue(d.toISOString());
}

/**
 * Phone handshake for a connection request:
 * 1) Incoming-call card — Accept, Refuse, or Decide later
 * 2) Where / when / note, or Do later (bell reminder)
 * Decide later keeps the request in the top-right notifications box.
 */
export function ConnectionRequestHost({ enabled = true }: { enabled?: boolean }) {
  const [offers, setOffers] = useState<ScanOfferCard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('alert');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [acceptedConnectionId, setAcceptedConnectionId] = useState<string | null>(null);
  const [acceptedName, setAcceptedName] = useState('');
  const [where, setWhere] = useState('');
  const [when, setWhen] = useState(toDateInputValue(new Date().toISOString()));
  const [note, setNote] = useState('');

  const active = useMemo(() => {
    const pinned = offers.find((offer) => offer.id === activeId);
    if (pinned) return pinned;
    return offers.find((offer) => !isScanOfferSnoozed(offer.id)) ?? null;
  }, [offers, activeId]);

  useEffect(() => {
    if (!enabled) return;
    void finalizeAcceptedScanConnectionsAction();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const result = await listPendingScanOffersAction();
        if (cancelled || result.error) return;
        setOffers(result.offers);
        setActiveId((prev) => {
          if (prev && result.offers.some((o) => o.id === prev) && !isScanOfferSnoozed(prev)) {
            return prev;
          }
          return result.offers.find((offer) => !isScanOfferSnoozed(offer.id))?.id ?? null;
        });
      } catch {
        // ignore transient failures
      }
    };

    void load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void load();
    }, 3_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onOpenOffer = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (!id) return;
      clearScanOfferSnooze(id);
      setActiveId(id);
      setStage('decision');
      setError(null);
    };
    const onOpenDetails = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; name: string }>).detail;
      if (!detail?.id) return;
      setAcceptedConnectionId(detail.id);
      setAcceptedName(detail.name || 'them');
      setWhere('');
      setWhen(toDateInputValue(new Date().toISOString()));
      setNote('');
      setStage('details');
      setError(null);
    };
    window.addEventListener('cc-open-scan-offer', onOpenOffer);
    window.addEventListener('cc-open-connection-details', onOpenDetails);
    return () => {
      window.removeEventListener('cc-open-scan-offer', onOpenOffer);
      window.removeEventListener('cc-open-connection-details', onOpenDetails);
    };
  }, [enabled]);

  useEffect(() => {
    if (stage === 'details') return;
    if (!active) {
      setStage('alert');
      return;
    }
    if (isScanOfferSnoozed(active.id)) return;
    setStage('decision');
  }, [active?.id, stage]);

  const closeCurrent = useCallback(() => {
    if (!active) return;
    setOffers((prev) => prev.filter((o) => o.id !== active.id));
    setStage('alert');
    setAcceptedConnectionId(null);
    setError(null);
  }, [active]);

  const decideLater = useCallback(() => {
    if (!active || pending) return;
    snoozeScanOffer(active.id);
    setActiveId(null);
    setStage('alert');
    setError(null);
  }, [active, pending]);

  const decline = useCallback(() => {
    if (!active || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await dismissScanOfferAction(active.id);
        if (!result.success) {
          setError(result.error ?? 'Could not decline.');
          return;
        }
        closeCurrent();
      } catch {
        setError('Could not decline. Try again.');
      }
    });
  }, [active, pending, closeCurrent]);

  const accept = useCallback(() => {
    if (!active || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await acceptScanOfferAction(active.id);
        if (!result.success || !result.connectionId) {
          setError(result.error ?? 'Could not accept.');
          return;
        }
        setAcceptedConnectionId(result.connectionId);
        setAcceptedName(active.scannerName);
        setWhere('');
        setWhen(toDateInputValue(new Date().toISOString()));
        setNote('');
        setStage('details');
        setOffers((prev) => prev.filter((o) => o.id !== active.id));
      } catch {
        setError('Could not accept. Try again.');
      }
    });
  }, [active, pending]);

  const saveDetails = useCallback(
    (opts?: { doLater?: boolean }) => {
      if (!acceptedConnectionId || pending) return;
      setError(null);
      startTransition(async () => {
        try {
          const result = await updateConnectionMetadataAction({
            connectionId: acceptedConnectionId,
            context: opts?.doLater ? where || null : where === '' ? null : where,
            metAt: opts?.doLater || when === '' ? null : `${when}T12:00:00.000Z`,
            privateNote: opts?.doLater ? note || null : note === '' ? null : note,
            followUpAt: opts?.doLater ? tomorrowIsoDate() : null,
          });
          if (!result.success) {
            setError(result.error ?? 'Could not save details.');
            return;
          }
          setAcceptedConnectionId(null);
          setStage('alert');
        } catch {
          setError('Could not save details. Try again.');
        }
      });
    },
    [acceptedConnectionId, pending, where, when, note],
  );

  if (!enabled) return null;

  const showDecision = Boolean(active) && stage === 'decision' && !isScanOfferSnoozed(active?.id ?? '');
  const showDetails = Boolean(acceptedConnectionId) && stage === 'details';

  return (
    <>
      <IncomingCall
        mode="connection"
        isOpen={showDecision && Boolean(active)}
        callerName={active?.scannerName ?? ''}
        callerInfo={active?.scannerHeadline ?? roleLabel(active?.scannerAudienceRole) ?? undefined}
        statusText="wants to connect with you"
        avatarUrl={active?.scannerAvatarUrl ?? undefined}
        onAccept={accept}
        onDecline={decline}
        onLater={decideLater}
        onClose={decideLater}
        busy={pending}
        acceptLabel={pending ? 'Adding…' : 'Accept'}
        declineLabel="Refuse"
        laterLabel="Decide later"
        error={error}
      />

      <HandshakePortal>
      <AnimatePresence>
        {showDetails ? (
          <motion.div
            key={`details-${acceptedConnectionId}`}
            className="cc-handshake-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="cc-handshake-sheet p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="connection-details-title"
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--app-iris)]">
              Save the moment
            </p>
            <h2
              id="connection-details-title"
              className="mt-2 text-[20px] font-medium tracking-[-0.02em] text-[var(--app-ink)]"
            >
              You connected with {acceptedName}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--app-smoke)]">
              Add where you met, when, and a private note — or do it later.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-[12px] font-medium text-[var(--app-smoke)]">
                Where
                <input
                  className="cc-app-input mt-1"
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  placeholder="Conference, campus, café…"
                  disabled={pending}
                />
              </label>
              <label className="block text-[12px] font-medium text-[var(--app-smoke)]">
                When
                <input
                  type="date"
                  className="cc-app-input mt-1"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  disabled={pending}
                />
              </label>
              <label className="block text-[12px] font-medium text-[var(--app-smoke)]">
                Note
                <textarea
                  className="cc-app-input mt-1 min-h-[72px] resize-y"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What to remember…"
                  disabled={pending}
                />
              </label>
            </div>

            {error ? (
              <p className="mt-3 text-[13px] text-[var(--app-error)]" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex flex-col gap-2">
              <Button
                className="h-12 w-full rounded-full"
                onClick={() => saveDetails()}
                disabled={pending}
              >
                {pending ? 'Saving…' : 'Save'}
              </Button>
              <Button
                variant="outline"
                className="h-12 w-full rounded-full"
                onClick={() => saveDetails({ doLater: true })}
                disabled={pending}
              >
                Do later
              </Button>
            </div>
          </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      </HandshakePortal>

    </>
  );
}
