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
