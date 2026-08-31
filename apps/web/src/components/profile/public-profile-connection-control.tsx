'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import {
  addConnectionAction,
  removeConnectionAction,
} from '@/app/actions/connections';
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

  const profileReturnPath = fromQrScan ? `/${profileSlug}?source=qr` : `/${profileSlug}`;
  const signInHref = `/sign-in?redirect=${encodeURIComponent(profileReturnPath)}`;

  const onAdd = useCallback(() => {
    if (pending || !fromQrScan) return;
    setError(null);
    setStatusMessage(null);
    startTransition(async () => {
      const result = await addConnectionAction({
        targetProfileId: profileId,
        targetSlug: profileSlug,
        source: 'qr',
      });
      if (!result.success) {
        setError(result.error ?? 'Could not add Connection.');
        setStatusMessage(null);
        return;
      }
      setConnected(true);
      if (result.connection?.id) {
        setConnectionId(result.connection.id);
      }
      setStatusMessage(
        result.alreadyConnected
          ? `${displayName} is already in your Connections.`
          : `Connected with ${displayName} from their CodeCard QR.`,
      );
      router.refresh();
    });
  }, [pending, fromQrScan, profileId, profileSlug, displayName, router]);

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

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="cc-app-btn cc-app-btn--primary !h-10"
        onClick={onAdd}
        disabled={pending}
        aria-busy={pending}
        aria-label={`Connect with ${displayName} from their CodeCard QR`}
      >
        {pending ? 'Saving…' : 'Connect from QR'}
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
      <p className="text-[13px] text-[var(--app-smoke)]">
        Physical QR scan confirmed. Connect to save them privately.
      </p>
    </div>
  );
}
