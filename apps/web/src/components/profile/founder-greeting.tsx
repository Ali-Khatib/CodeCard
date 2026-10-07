'use client';

import { useEffect, useState } from 'react';

const SESSION_KEY = 'cc-founder-greeting-seen';
const DISPLAY_MS = 3200;

/**
 * Brief elite greeting when someone opens the founder CodeCard.
 * Shows once per browser session, then fades.
 */
export function FounderGreeting({ displayName }: { displayName: string }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return;
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // private mode — still show once this mount
    }

    const show = window.setTimeout(() => setVisible(true), 40);
    const leave = window.setTimeout(() => setLeaving(true), DISPLAY_MS);
    const hide = window.setTimeout(() => setVisible(false), DISPLAY_MS + 520);

    return () => {
      window.clearTimeout(show);
      window.clearTimeout(leave);
      window.clearTimeout(hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`cc-founder-greeting${leaving ? ' cc-founder-greeting--out' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="cc-founder-greeting__panel">
        <p className="cc-founder-greeting__mark">CodeCard Founder</p>
        <p className="cc-founder-greeting__title">You’re looking at the founder.</p>
        <p className="cc-founder-greeting__body">
          {displayName} built CodeCard — the card you’re reading right now.
        </p>
      </div>
    </div>
  );
}
