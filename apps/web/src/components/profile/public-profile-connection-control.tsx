'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  addConnectionAction,
  removeConnectionAction,
} from '@/app/actions/connections';
import { createClient } from '@/lib/supabase/client';

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
  isOwnProfile: isOwnProfileProp,
  isAuthenticated: isAuthenticatedProp,
  initiallyConnected,
  initialConnectionId,
}: PublicProfileConnectionControlProps) {
  const router = useRouter();
  const [ready, setReady] = useState(isAuthenticatedProp || isOwnProfileProp);
  const [isOwnProfile, setIsOwnProfile] = useState(isOwnProfileProp);
  const [isAuthenticated, setIsAuthenticated] = useState(isAuthenticatedProp);
  const [connected, setConnected] = useState(initiallyConnected);
  const [connectionId, setConnectionId] = useState<string | null>(initialConnectionId);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          setIsAuthenticated(false);
          setIsOwnProfile(false);
          setReady(true);
          return;
        }

        const { data: viewerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('owner_user_id', user.id)
          .maybeSingle();
        if (cancelled) return;

        const own = viewerProfile?.id === profileId;
        setIsOwnProfile(own);
        setIsAuthenticated(true);

        if (!own) {
          const { data: existing } = await supabase
            .from('saved_connections')
            .select('id')
            .eq('owner_user_id', user.id)
            .eq('saved_profile_id', profileId)
            .maybeSingle();
          if (cancelled) return;
          setConnected(Boolean(existing));
          setConnectionId(existing?.id ?? null);
        }
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const signInHref = `/sign-in?redirect=${encodeURIComponent(`/${profileSlug}`)}`;

  const onAdd = useCallback(() => {
    if (pending) return;
    setError(null);
    setStatusMessage(null);
    startTransition(async () => {
      const result = await addConnectionAction({
        targetProfileId: profileId,
        targetSlug: profileSlug,
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
          : `Added ${displayName} to your Connections.`,
      );
      router.refresh();
    });
  }, [pending, profileId, profileSlug, displayName, router]);

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

  if (!ready) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <span className="cc-app-btn cc-app-btn--ghost !h-10 inline-flex items-center justify-center opacity-60">
          Checking connection…
        </span>
      </div>
    );
  }

  if (isOwnProfile) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href={signInHref}
          className="cc-app-btn cc-app-btn--ghost !h-10 inline-flex items-center justify-center"
        >
          Sign in to add connection
        </Link>
        <p className="text-[13px] text-[var(--app-smoke)]">
          Save people whose work matters to you — then find them again in Connections.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {connected ? (
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
      ) : (
        <button
          type="button"
          className="cc-app-btn cc-app-btn--primary !h-10"
          onClick={onAdd}
          disabled={pending}
          aria-busy={pending}
          aria-label={`Add ${displayName} as a Connection`}
        >
          {pending ? 'Saving…' : 'Add connection'}
        </button>
      )}
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
      {connected && !pending && !statusMessage && (
        <p className="text-[13px] text-[var(--app-smoke)]">Connected</p>
      )}
    </div>
  );
}
