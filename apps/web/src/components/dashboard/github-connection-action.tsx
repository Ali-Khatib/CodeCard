'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { useMutationFeedback } from '@/components/dashboard/mutation-feedback-provider';
import { createClient } from '@/lib/supabase/client';
import { disconnectGithubIdentity } from '@/lib/auth/github-identity-actions';
import {
  GITHUB_LAST_IDENTITY_MESSAGE,
  linkGithubIdentity,
  startGithubOAuth,
} from '@/lib/auth/github-oauth';
import { mapAuthFormError } from '@/lib/auth/map-auth-form-error';

type GithubConnectionActionProps = {
  live: boolean;
  connected: boolean;
  canDisconnect: boolean;
};

export function GithubConnectionAction({
  live,
  connected,
  canDisconnect,
}: GithubConnectionActionProps) {
  const router = useRouter();
  const { notifySuccess, notifyError } = useMutationFeedback();
  const inFlightRef = useRef(false);
  const [statusText, setStatusText] = useState('');

  const connect = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setStatusText('Opening GitHub…');
    try {
      const supabase = createClient();
      const linked = await linkGithubIdentity({
        supabase,
        redirectPath: '/dashboard/settings',
      });
      if (linked.ok) return;

      const oauth = await startGithubOAuth({
        supabase,
        redirectPath: '/dashboard/settings',
      });
      if (!oauth.ok) {
        const message = mapAuthFormError(oauth.message, 'sign-in');
        setStatusText(message);
        notifyError(message);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [notifyError]);

  const disconnect = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setStatusText('Disconnecting GitHub…');
    try {
      const result = await disconnectGithubIdentity();
      if (!result.ok) {
        setStatusText(result.message);
        notifyError(result.message);
        return;
      }
      setStatusText('GitHub disconnected.');
      notifySuccess('GitHub disconnected.');
      router.refresh();
    } finally {
      inFlightRef.current = false;
    }
  }, [notifyError, notifySuccess, router]);

  if (!live) {
    return (
      <span className="text-[14px] text-[var(--app-smoke)]">
        {connected ? 'Connected' : 'Not connected'}
      </span>
    );
  }

  if (connected && !canDisconnect) {
    return (
      <div className="flex min-w-0 flex-col items-end gap-1">
        <span className="text-[14px] text-[var(--app-smoke)]">Connected</span>
        <p className="max-w-[220px] text-right text-[12px] leading-snug text-[var(--app-smoke)]">
          {GITHUB_LAST_IDENTITY_MESSAGE}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="text-[14px] text-[var(--app-smoke)]">
          {connected ? 'Connected' : 'Not connected'}
        </span>
        <AsyncActionButton
          variant="ghost"
          successLabel={connected ? 'Disconnected' : 'Connecting'}
          ariaLabel={connected ? 'Disconnect GitHub' : 'Connect GitHub'}
          onAction={connected ? disconnect : connect}
        >
          {connected ? 'Disconnect' : 'Connect'}
        </AsyncActionButton>
      </div>
      {statusText ? (
        <p
          className="max-w-[220px] text-right text-[12px] leading-snug text-[var(--app-smoke)]"
          role="status"
          aria-live="polite"
        >
          {statusText}
        </p>
      ) : (
        <p className="max-w-[220px] text-right text-[12px] leading-snug text-[var(--app-smoke)]">
          {connected
            ? 'Stops future GitHub sign-in for this account'
            : 'Uses GitHub only to identify your account'}
        </p>
      )}
    </div>
  );
}
