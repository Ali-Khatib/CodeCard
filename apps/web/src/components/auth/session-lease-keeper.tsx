'use client';

import { useEffect } from 'react';
import {
  serializeSessionLeaseCookie,
  SESSION_LEASE_CLOSE_MAX_AGE_SECONDS,
  SESSION_LEASE_COOKIE,
} from '@/lib/auth/session-lease';

const TAB_MAP_KEY = 'cc-open-tabs';
const TAB_FRESH_MS = 15_000;

function readTabs(): Record<string, number> {
  try {
    const raw = localStorage.getItem(TAB_MAP_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, number>;
  } catch {
    return {};
  }
}

function freshTabs(map: Record<string, number>): Record<string, number> {
  const now = Date.now();
  const next: Record<string, number> = {};
  for (const [id, ts] of Object.entries(map)) {
    if (typeof ts === 'number' && now - ts < TAB_FRESH_MS) next[id] = ts;
  }
  return next;
}

function browserHasAuthCookie(): boolean {
  return document.cookie.split(';').some((part) => part.includes('auth-token'));
}

function browserHasLease(): boolean {
  return document.cookie.split(';').some((part) => part.trim().startsWith(`${SESSION_LEASE_COOKIE}=`));
}

/**
 * Keeps the sign-in lease alive only while a CodeCard tab is open.
 * Closing the last tab shrinks it so the next visit is logged out.
 */
export function SessionLeaseKeeper() {
  useEffect(() => {
    const tabId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const beat = () => {
      const map = freshTabs(readTabs());
      map[tabId] = Date.now();
      localStorage.setItem(TAB_MAP_KEY, JSON.stringify(map));
      if (browserHasLease() || browserHasAuthCookie()) {
        document.cookie = serializeSessionLeaseCookie();
      }
    };

    const onPageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      const map = freshTabs(readTabs());
      delete map[tabId];
      localStorage.setItem(TAB_MAP_KEY, JSON.stringify(map));
      if (Object.keys(map).length > 0) return;
      if (browserHasLease() || browserHasAuthCookie()) {
        document.cookie = serializeSessionLeaseCookie(SESSION_LEASE_CLOSE_MAX_AGE_SECONDS);
      }
    };

    beat();
    const timer = window.setInterval(beat, 8_000);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  return null;
}
