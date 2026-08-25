import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * WS14-T016 — Upstash rate-limit contracts (no live Redis / no secrets).
 */

const ROOT = path.resolve(__dirname, '../../../..');
const WEB = path.resolve(__dirname, '../..');

function readRepo(rel: string) {
  return readFileSync(path.resolve(ROOT, rel), 'utf8');
}

function readWeb(rel: string) {
  return readFileSync(path.resolve(WEB, rel), 'utf8');
}

describe('WS14-T016 Upstash documentation contract', () => {
  it('documents server-only Redis vars and fail-closed policy', () => {
    const doc = readRepo('docs/UPSTASH.md');
    expect(doc).toContain('UPSTASH_REDIS_REST_URL');
    expect(doc).toContain('UPSTASH_REDIS_REST_TOKEN');
    expect(doc).toMatch(/fail closed/i);
    expect(doc).toContain('CODECARD_RATE_LIMIT_VERIFY');
    expect(doc).toContain('429');
    expect(doc).not.toMatch(/gQAAAAAA/);
    expect(doc).not.toMatch(/nearby-starfish/);
  });

  it('keeps verify probe gated and non-abusable by default', () => {
    const route = readWeb('src/app/api/internal/rate-limit-verify/route.ts');
    expect(route).toContain('CODECARD_RATE_LIMIT_VERIFY');
    expect(route).toContain("!== '1'");
    expect(route).toContain('slidingWindow(3');
    expect(route).toContain('codecard:rl-verify');
    expect(route).toContain('rateLimited()');
  });

  it('wires rate-limit module and env example without secrets', () => {
    const rl = readWeb('src/lib/rate-limit.ts');
    expect(rl).toContain('UPSTASH_REDIS_REST_URL');
    expect(rl).toContain('UPSTASH_REDIS_REST_TOKEN');
    expect(rl).toMatch(/fail closed|success: false/i);

    const example = readWeb('.env.example');
    expect(example).toContain('UPSTASH_REDIS_REST_URL=');
    expect(example).toContain('UPSTASH_REDIS_REST_TOKEN=');
    expect(example).not.toMatch(/gQAAAAAA/);
  });
});

describe('WS14-T016 rateLimit fail-closed behavior', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('denies strict types in production without Redis', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CODECARD_E2E', '');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const { rateLimit } = await import('@/lib/rate-limit');
    await expect(rateLimit('t', 'upload')).resolves.toEqual({ success: false });
    await expect(rateLimit('t', 'auth')).resolves.toEqual({ success: false });
    await expect(rateLimit('t', 'ai')).resolves.toEqual({ success: false });
  });

  it('allows non-strict types without Redis', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CODECARD_E2E', '');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const { rateLimit } = await import('@/lib/rate-limit');
    await expect(rateLimit('t', 'analytics')).resolves.toEqual({ success: true });
  });

  it('allows strict types without Redis when isolated E2E is on', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CODECARD_E2E', '1');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const { rateLimit } = await import('@/lib/rate-limit');
    await expect(rateLimit('t', 'upload')).resolves.toEqual({ success: true });
  });
});

/**
 * Redis configured but unreachable. This previously threw out of `rateLimit`,
 * so an Upstash outage turned every rate-limited route into a 500 — including
 * public research PDF reads. The policy must match the no-Redis policy above.
 */
describe('rateLimit when Redis is configured but unreachable', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock('@upstash/ratelimit');
  });

  async function importWithFailingLimiter() {
    vi.doMock('@upstash/ratelimit', () => ({
      Ratelimit: class {
        static slidingWindow = () => ({});
        static tokenBucket = () => ({});
        limit() {
          return Promise.reject(new Error('getaddrinfo ENOTFOUND upstash.example'));
        }
      },
    }));
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://unreachable.example');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'placeholder-token');
    return import('@/lib/rate-limit');
  }

  it('does not throw, so routes return their normal response', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CODECARD_E2E', '');
    const { rateLimit } = await importWithFailingLimiter();
    await expect(rateLimit('t', 'publicResearchPdf')).resolves.toEqual({ success: true });
  });

  it('degrades to allow for public read endpoints', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CODECARD_E2E', '');
    const { rateLimit } = await importWithFailingLimiter();
    await expect(rateLimit('t', 'analytics')).resolves.toEqual({ success: true });
  });

  it('still denies strict endpoints in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CODECARD_E2E', '');
    const { rateLimit } = await importWithFailingLimiter();
    for (const type of ['upload', 'auth', 'ai'] as const) {
      await expect(rateLimit('t', type)).resolves.toEqual({ success: false });
    }
  });

  it('denies the paid AI token bucket in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { rateLimitTokenBucket } = await importWithFailingLimiter();
    await expect(rateLimitTokenBucket('t', 5, '1 m')).resolves.toEqual({ success: false });
  });

  it('never logs the Redis URL or token', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rateLimit } = await importWithFailingLimiter();
    await rateLimit('t', 'analytics');
    for (const call of spy.mock.calls.flat()) {
      expect(String(call)).not.toMatch(/unreachable\.example|placeholder-token/);
    }
    spy.mockRestore();
  });
});
