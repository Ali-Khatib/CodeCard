import type { ErrorEvent } from '@sentry/nextjs';
import { isNoisyExpectedError, scrubExtra, scrubHeaders, scrubUrl } from './scrub';

/**
 * Shared Sentry init options (WS14-T015).
 * DSN stays on `SENTRY_DSN` (server/edge). Browser capture uses the same public
 * project DSN via optional `NEXT_PUBLIC_SENTRY_DSN` — Sentry DSNs are public
 * identifiers by design, not application secrets.
 */
export function resolveSentryDsn(): string | undefined {
  return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || undefined;
}

export function resolveSentryEnvironment(): string {
  return process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
}

export function resolveSentryRelease(): string | undefined {
  return (
    process.env.SENTRY_RELEASE ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    undefined
  );
}

export function buildSentryOptions(dsn: string) {
  return {
    dsn,
    environment: resolveSentryEnvironment(),
    release: resolveSentryRelease(),
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event: ErrorEvent): ErrorEvent | null {
      const message =
        event.message ||
        event.exception?.values?.[0]?.value ||
        event.exception?.values?.[0]?.type;
      if (isNoisyExpectedError(message)) {
        return null;
      }

      if (event.request) {
        event.request.cookies = undefined;
        event.request.headers = scrubHeaders(
          event.request.headers as Record<string, string> | undefined,
        );
        event.request.url = scrubUrl(event.request.url);
        event.request.query_string = undefined;
        event.request.data = undefined;
      }

      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
        delete event.user.username;
        // Keep opaque id only when already present; never add PII.
      }

      event.extra = scrubExtra(event.extra as Record<string, unknown> | undefined);

      if (event.tags) {
        delete event.tags.authorization;
        delete event.tags.cookie;
      }

      return event;
    },
  };
}
