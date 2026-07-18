'use client';

import Link from 'next/link';

/**
 * Root App Router error boundary (WS11-T008).
 * Must render its own html/body. Never displays exception text or stacks to users.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#0b0f14',
          color: '#e8eef5',
          padding: '24px',
        }}
      >
        <main id="main-content" tabIndex={-1} style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 12px' }}>Something went wrong</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: '#9aa7b5', margin: '0 0 20px' }}>
            An unexpected error occurred. Please try again. If the problem continues, return to the
            home page.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                background: '#3d7eff',
                color: '#fff',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                borderRadius: 8,
                padding: '10px 16px',
                background: 'transparent',
                color: '#9aa7b5',
                fontSize: 14,
                textDecoration: 'none',
                border: '1px solid #2a3542',
              }}
            >
              Go home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
