'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  addConnectionAction,
  removeConnectionAction,
  requestQrConnectionAction,
} from '@/app/actions/connections';
import { getOutgoingScanStatusAction } from '@/app/actions/scan-offers';
import { updateConnectionMetadataAction } from '@/app/actions/connection-metadata';
import { HandshakePortal } from '@/components/connections/handshake-portal';
import { toDateInputValue } from '@/lib/schedule/datetime';
import { parseProfileViewSource } from '@/lib/sharing/profile-view-source';

type PublicProfileConnectionControlProps = {
  profileId: string;
  profileSlug: string;
  displayName: string;
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  initiallyConnected: boolean;
  initialConnectionId: string | null;
};

export function PublicProfileConnectionControl({
  profileId,
  profileSlug,
  displayName,
  isOwnProfile,
  isAuthenticated,
  initiallyConnected,
  initialConnectionId,
}: PublicProfileConnectionControlProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromQrScan = useMemo(
    () => parseProfileViewSource(searchParams.get('source')) === 'qr',
    [searchParams],
  );
  const [connected, setConnected] = useState(initiallyConnected);
  const [connectionId, setConnectionId] = useState<string | null>(initialConnectionId);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [promptReady, setPromptReady] = useState(false);
  const [asked, setAsked] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [where, setWhere] = useState('');
  const [when, setWhen] = useState(() => toDateInputValue(new Date().toISOString()));
  const [note, setNote] = useState('');
  const finishingRef = useRef(false);

  const profileReturnPath = fromQrScan ? `/${profileSlug}?source=qr` : `/${profileSlug}`;
  const signInHref = `/sign-in?redirect=${encodeURIComponent(profileReturnPath)}`;

  useEffect(() => {
    if (!fromQrScan || !isAuthenticated || connected) return;
    let cancelled = false;
    void (async () => {
      const status = await getOutgoingScanStatusAction(profileId);
      if (cancelled) return;
      if (status.status === 'pending' || status.status === 'accepted') setAsked(true);
      if (status.status === 'dismissed') setDeclined(true);
    })();
    const timer = window.setTimeout(() => {
      if (!cancelled) setPromptReady(true);
    }, 2800);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fromQrScan, isAuthenticated, connected, profileId]);

  const finishAccepted = useCallback(() => {
    if (pending || finishingRef.current) return;
    finishingRef.current = true;
    setError(null);
    startTransition(async () => {
      const result = await addConnectionAction({
        targetProfileId: profileId,
        targetSlug: profileSlug,
        source: 'qr',
      });
      if (!result.success || !result.connection?.id) {
        finishingRef.current = false;
        setError(result.error ?? 'Could not finish the connection.');
        return;
      }
      setConnected(true);
      setConnectionId(result.connection.id);
      setDetailsOpen(true);
      setStatusMessage(`${displayName} accepted. You're connected.`);
      router.refresh();
    });
  }, [pending, profileId, profileSlug, displayName, router]);

  useEffect(() => {
    if (!asked || connected || declined || !fromQrScan) return;
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState === 'hidden') return;
      const status = await getOutgoingScanStatusAction(profileId);
      if (cancelled) return;
      if (status.status === 'accepted') {
        finishAccepted();
      } else if (status.status === 'dismissed') {
        setAsked(false);
        setDeclined(true);
      }
    };
    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [asked, connected, declined, fromQrScan, profileId, finishAccepted]);

  const onAsk = useCallback(() => {
    if (pending || !fromQrScan) return;
    setError(null);
    setStatusMessage(null);
    startTransition(async () => {
      const result = await requestQrConnectionAction({
        targetProfileId: profileId,
        targetSlug: profileSlug,
        source: 'qr',
      });
      if (!result.success) {
        setError(result.error ?? 'Could not send the request.');
        return;
      }
      if (result.alreadyConnected && result.connection?.id) {
        setConnected(true);
        setConnectionId(result.connection.id);
        setStatusMessage(`${displayName} is already in your Connections.`);
        return;
      }
      setAsked(true);
      setStatusMessage(`Waiting for ${displayName} to accept.`);
    });
  }, [pending, fromQrScan, profileId, profileSlug, displayName]);

  const saveDetails = useCallback(
    (opts?: { doLater?: boolean }) => {
      if (!connectionId || pending) return;
      setError(null);
      startTransition(async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const result = await updateConnectionMetadataAction({
          connectionId,
          context: opts?.doLater ? where || null : where === '' ? null : where,
          metAt: opts?.doLater || when === '' ? null : `${when}T12:00:00.000Z`,
          privateNote: opts?.doLater ? note || null : note === '' ? null : note,
          followUpAt: opts?.doLater ? toDateInputValue(tomorrow.toISOString()) : null,
        });
        if (!result.success) {
          setError(result.error ?? 'Could not save details.');
          return;
        }
        setDetailsOpen(false);
        setStatusMessage(
          opts?.doLater
            ? 'Saved for later. It will sit in your notifications until you finish it.'
            : `Saved how you met ${displayName}.`,
        );
      });
    },
    [connectionId, pending, where, when, note, displayName],
  );

  const onRemove = useCallback(() => {
    if (pending) return;
    const confirmed = window.confirm(
      `Remove ${displayName} from your Connections? This does not delete their CodeCard.`,
    );
    if (!confirmed) return;

    setError(null);
    setStatusMessage(null);
    startTransition(async () => {
      const result = await removeConnectionAction({
        connectionId: connectionId ?? undefined,
        targetProfileId: profileId,
        targetSlug: profileSlug,
      });
      if (!result.success) {
        setError(result.error ?? 'Could not remove Connection.');
        return;
      }
      setConnected(false);
      setConnectionId(null);
      setStatusMessage(`Removed ${displayName} from your Connections.`);
      router.refresh();
    });
  }, [pending, connectionId, profileId, profileSlug, displayName, router]);

  if (isOwnProfile) {
    return null;
  }

  if (connected) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="cc-app-btn cc-app-btn--ghost !h-10"
          onClick={onRemove}
          disabled={pending}
          aria-busy={pending}
          aria-label={`Remove ${displayName} from Connections`}
        >
          {pending ? 'Updating…' : 'Remove connection'}
        </button>
        <p className="sr-only" role="status" aria-live="polite">
          {pending ? 'Updating connection' : statusMessage ?? ''}
        </p>
        {statusMessage && !pending && (
          <p className="text-[13px] text-[var(--app-smoke)]" aria-live="polite">
            {statusMessage}
          </p>
        )}
        {error && (
          <p className="text-[13px] text-[var(--app-danger,#b42318)]" role="alert">
            {error}
          </p>
        )}
        {!pending && !statusMessage && (
          <p className="text-[13px] text-[var(--app-smoke)]">Connected</p>
        )}
        <Link
          href="/dashboard/connections"
          className="text-[13px] font-medium text-[var(--app-ink)] underline-offset-2 hover:underline"
        >
          View in Connections
        </Link>
        {detailsOpen ? (
          <HandshakePortal>
          <HandshakeDetails
            name={displayName}
            where={where}
            when={when}
            note={note}
            pending={pending}
            error={error}
            onWhere={setWhere}
            onWhen={setWhen}
            onNote={setNote}
            onSave={() => saveDetails()}
            onLater={() => saveDetails({ doLater: true })}
          />
          </HandshakePortal>
        ) : null}
      </div>
    );
  }

  if (!fromQrScan) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[13px] leading-relaxed text-[var(--app-smoke)]">
          Connect in person. Scan their CodeCard QR — no searching, usernames, or digital invites.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href={signInHref}
          className="cc-app-btn cc-app-btn--ghost !h-10 inline-flex items-center justify-center"
        >
          Sign in to connect
        </Link>
        <p className="text-[13px] text-[var(--app-smoke)]">
          You scanned their CodeCard QR. Sign in to save this connection.
        </p>
      </div>
    );
  }

  const showPrompt = promptReady && !asked && !declined;

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {pending ? 'Updating connection' : statusMessage ?? ''}
      </p>
      {showPrompt ? (
        <HandshakePortal>
        <div className="cc-handshake-overlay">
          <div className="cc-handshake-sheet p-6" role="dialog" aria-modal="true" aria-labelledby="qr-connect-title">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--app-iris)]">
              In person
            </p>
            <h2 id="qr-connect-title" className="mt-2 font-serif text-[1.65rem] leading-tight text-[var(--app-ink)]">
              Connect with {displayName}?
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--app-smoke)]">
              They get a request on their phone. Nothing is saved until they accept.
            </p>
            {error ? (
              <p className="mt-3 text-[13px] text-[var(--app-danger,#b42318)]" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              className="cc-app-btn cc-app-btn--primary mt-5 !h-12 w-full"
              onClick={onAsk}
              disabled={pending}
              aria-busy={pending}
              aria-label={`Connect from QR with ${displayName}`}
            >
              {pending ? 'Sending…' : 'Connect'}
            </button>
          </div>
        </div>
        </HandshakePortal>
      ) : null}
      {asked && !connected ? (
        <HandshakePortal>
        <div className="cc-handshake-overlay">
          <div className="cc-handshake-sheet p-6" role="status" aria-live="polite">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--app-iris)]">
              Waiting
            </p>
            <h2 className="mt-2 font-serif text-[1.65rem] leading-tight text-[var(--app-ink)]">
              {displayName}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--app-smoke)]">
              Waiting for them to accept. Keep this screen open.
            </p>
          </div>
        </div>
        </HandshakePortal>
      ) : null}
      {declined ? (
        <p className="text-[13px] text-[var(--app-smoke)]">They said not this time.</p>
      ) : null}
    </>
  );
}

function HandshakeDetails({
  name,
  where,
  when,
  note,
  pending,
  error,
  onWhere,
  onWhen,
  onNote,
  onSave,
  onLater,
}: {
  name: string;
  where: string;
  when: string;
  note: string;
  pending: boolean;
  error: string | null;
  onWhere: (value: string) => void;
  onWhen: (value: string) => void;
  onNote: (value: string) => void;
  onSave: () => void;
  onLater: () => void;
}) {
  return (
    <div className="cc-handshake-overlay">
      <div className="cc-handshake-sheet p-5" role="dialog" aria-modal="true" aria-labelledby="scanner-details-title">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--app-iris)]">
          You connected
        </p>
        <h2 id="scanner-details-title" className="mt-2 font-serif text-[1.55rem] leading-tight text-[var(--app-ink)]">
          How did you meet {name}?
        </h2>
        <label className="mt-4 block text-[13px] text-[var(--app-smoke)]">
          Where
          <input className="cc-app-input mt-1 w-full" value={where} onChange={(event) => onWhere(event.target.value)} placeholder="Campus, event, cafe" />
        </label>
        <label className="mt-3 block text-[13px] text-[var(--app-smoke)]">
          When
          <input className="cc-app-input mt-1 w-full" type="date" value={when} onChange={(event) => onWhen(event.target.value)} />
        </label>
        <label className="mt-3 block text-[13px] text-[var(--app-smoke)]">
          Note
          <textarea className="cc-app-input mt-1 w-full" rows={3} value={note} onChange={(event) => onNote(event.target.value)} placeholder="What you talked about" />
        </label>
        {error ? (
          <p className="mt-3 text-[13px] text-[var(--app-danger,#b42318)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" className="cc-app-btn cc-app-btn--primary !h-12 w-full" onClick={onSave} disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="cc-app-btn cc-app-btn--ghost !h-12 w-full" onClick={onLater} disabled={pending}>
            Do later
          </button>
        </div>
      </div>
    </div>
  );
}
