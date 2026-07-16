import { afterEach, describe, expect, it, vi } from 'vitest';

describe('WS08-T004 sticky analytics session', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('reuses the same sessionStorage id within a tab', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
      },
    });
    vi.stubGlobal('crypto', {
      randomUUID: () => '11111111-1111-4111-8111-111111111111',
    });

    const { createSessionId, getAnalyticsSessionId } = await import('@codecard/analytics');
    const a = createSessionId();
    const b = getAnalyticsSessionId();
    expect(a).toBe('11111111-1111-4111-8111-111111111111');
    expect(b).toBe(a);
  });
});
