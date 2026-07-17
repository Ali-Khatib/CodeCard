'use client';

import { useEffect, useState } from 'react';
import { PUBLIC_XSS_PAYLOADS, toSafeHttpHref } from '@/lib/security/safe-href';

/**
 * Renders representative XSS strings as plain React text and safe href checks.
 * Enabled only when CODECARD_E2E_FIXTURES=1 — disposable fixture, not production data.
 */
export function XssPublicHarness() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const samples = PUBLIC_XSS_PAYLOADS.slice(0, 10);

  return (
    <main
      className="min-h-[100dvh] overflow-x-hidden bg-[var(--app-canvas)] p-4 text-[var(--app-ink)]"
      data-e2e-ready={ready ? 'true' : 'false'}
      data-e2e-xss="true"
    >
      <h1 className="text-[24px] font-semibold">XSS public render fixture</h1>
      <p className="mt-2 text-[14px] text-[var(--app-smoke)]">
        Payloads must remain inert text. Unsafe hrefs must not become clickable.
      </p>
      <ul className="mt-6 space-y-3" aria-label="XSS payload samples">
        {samples.map((payload) => {
          const safeHref = toSafeHttpHref(payload);
          return (
            <li key={payload.slice(0, 48)} data-testid="xss-sample">
              <p data-testid="xss-text">{payload}</p>
              {safeHref ? (
                <a href={safeHref} rel="noopener noreferrer" data-testid="xss-safe-link">
                  Safe link
                </a>
              ) : (
                <span data-testid="xss-rejected-link">Link rejected</span>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
