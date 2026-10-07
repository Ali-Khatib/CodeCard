'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { handleSessionExpired } from '@/lib/auth/session-expiry';
import { isSupabasePublicKeyConfigured } from '@/lib/supabase/public-key';

/** Idle timeout — no pointer/keyboard/touch activity → sign out. */
export const AUTH_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

function shouldGuardPath(pathname: string | null): boolean {
  if (!pathname?.startsWith('/dashboard')) return false;
  if (pathname.startsWith('/dashboard/preview')) return false;
  return true;
}

function beaconSignOut() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/auth/sign-out');
      return;
    }
  } catch {
    // fall through
  }
  void fetch('/api/auth/sign-out', {
    method: 'POST',
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => undefined);
}

async function signOutLocal() {
  if (!isSupabasePublicKeyConfigured()) return;
  try {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // ignore — tab may already be unloading
  }
}

/**
 * Never leave an authenticated dashboard session hanging:
 * - redirect after explicit SIGNED_OUT
 * - sign out when the tab is closed / navigated away (pagehide)
 * - sign out after idle timeout
 */
export function useDashboardSessionGuard() {
  const pathname = usePathname();
  const redirecting = useRef(false);
  const idleTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!shouldGuardPath(pathname)) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (redirecting.current) return;
      if (event === 'SIGNED_OUT' && !session) {
        redirecting.current = true;
        handleSessionExpired(pathname);
      }
    });

    const forceSignOut = () => {
      if (redirecting.current) return;
      beaconSignOut();
      void signOutLocal().then(() => {
        if (redirecting.current) return;
        redirecting.current = true;
        handleSessionExpired(pathname);
      });
    };

    const resetIdle = () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        forceSignOut();
      }, AUTH_IDLE_TIMEOUT_MS);
    };

    const onPageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      beaconSignOut();
      void signOutLocal();
    };

    resetIdle();
    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, resetIdle, { passive: true });
    }
    window.addEventListener('pagehide', onPageHide);

    return () => {
      subscription.unsubscribe();
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, resetIdle);
      }
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [pathname]);
}
