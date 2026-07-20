import * as Sentry from '@sentry/nextjs';
import { buildSentryOptions, resolveSentryDsn } from './src/lib/sentry/options';

const dsn = resolveSentryDsn();

if (dsn) {
  Sentry.init(buildSentryOptions(dsn));
}
