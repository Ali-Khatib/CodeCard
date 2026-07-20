import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isNoisyExpectedError,
  scrubExtra,
  scrubHeaders,
  scrubUrl,
} from '@/lib/sentry/scrub';

/**
 * WS14-T015 — Sentry initialization and redaction contracts.
 */

const ROOT = path.resolve(__dirname, '../../../../..');
const WEB = path.resolve(__dirname, '../../..');

function readRepo(rel: string) {
  return readFileSync(path.resolve(ROOT, rel), 'utf8');
}

function readWeb(rel: string) {
  return readFileSync(path.resolve(WEB, rel), 'utf8');
}

describe('WS14-T015 Sentry scrubbing', () => {
  it('filters authorization and cookie headers', () => {
    const scrubbed = scrubHeaders({
      authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaaa.bbbb',
      cookie: 'sb-access-token=secret',
      'content-type': 'application/json',
    });
    expect(scrubbed?.authorization).toBe('[Filtered]');
    expect(scrubbed?.cookie).toBe('[Filtered]');
    expect(scrubbed?.['content-type']).toBe('application/json');
  });

  it('scrubs sensitive query params from URLs', () => {
    expect(scrubUrl('/auth/callback?code=abc&slug=ok')).toContain('code=%5BFiltered%5D');
    expect(scrubUrl('/auth/callback?code=abc&slug=ok')).toContain('slug=ok');
    expect(scrubUrl('https://example.com/reset?password=secret&x=1')).toContain(
      'password=%5BFiltered%5D',
    );
  });

  it('scrubs token-like extras', () => {
    const scrubbed = scrubExtra({
      note: 'safe',
      refresh_token: 'rrrr',
      leak: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaaa.bbbb',
    });
    expect(scrubbed?.note).toBe('safe');
    expect(scrubbed?.refresh_token).toBe('[Filtered]');
    expect(scrubbed?.leak).toBe('[Filtered]');
  });

  it('drops noisy expected framework errors', () => {
    expect(isNoisyExpectedError('NEXT_REDIRECT')).toBe(true);
    expect(isNoisyExpectedError('CodeCard boom')).toBe(false);
  });
});

describe('WS14-T015 Sentry wiring contract', () => {
  it('wires server, edge, client, instrumentation, and next config', () => {
    expect(readWeb('package.json')).toContain('@sentry/nextjs');
    expect(readWeb('src/instrumentation.ts')).toContain('captureRequestError');
    expect(readWeb('sentry.server.config.ts')).toContain('Sentry.init');
    expect(readWeb('sentry.edge.config.ts')).toContain('Sentry.init');
    expect(readWeb('instrumentation-client.ts')).toContain('Sentry.init');
    expect(readWeb('next.config.ts')).toContain('withSentryConfig');
    expect(readWeb('next.config.ts')).toContain('SENTRY_AUTH_TOKEN');
    expect(readWeb('src/app/global-error.tsx')).toContain('captureException');
  });

  it('keeps verification probe gated and non-public by default', () => {
    const route = readWeb('src/app/api/internal/sentry-verify/route.ts');
    expect(route).toContain('CODECARD_SENTRY_VERIFY');
    expect(route).toContain("!== '1'");
    expect(route).toContain('CodeCard WS14-T015 Sentry verification event');
    expect(route).not.toMatch(/sk_live_|whsec_|eyJ[A-Za-z0-9_-]{20,}/);
  });

  it('documents DSN variables without embedding secrets', () => {
    const doc = readRepo('docs/SENTRY.md');
    expect(doc).toContain('SENTRY_DSN');
    expect(doc).toContain('NEXT_PUBLIC_SENTRY_DSN');
    expect(doc).toContain('CODECARD_SENTRY_VERIFY');
    expect(doc).toMatch(/server-only/i);
    expect(doc).not.toMatch(/https:\/\/[a-f0-9]{20,}@/);
    expect(doc).not.toMatch(/sntrys_[A-Za-z0-9]+/);

    const example = readWeb('.env.example');
    expect(example).toContain('SENTRY_DSN=');
    expect(example).toContain('NEXT_PUBLIC_SENTRY_DSN=');
  });
});
