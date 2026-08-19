import * as Sentry from '@sentry/nextjs';
import { assertNoLeakedPublicSecrets } from '@/lib/security/env';

export async function register() {
  assertNoLeakedPublicSecrets();

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
