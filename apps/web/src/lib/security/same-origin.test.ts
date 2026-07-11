import { describe, expect, it } from 'vitest';
import { isSameOriginMutation } from './same-origin';

describe('isSameOriginMutation', () => {
  it('accepts same-origin requests', () => {
    const request = new Request('https://codecard.app/api/upload', {
      method: 'POST',
      headers: {
        origin: 'https://codecard.app',
        'sec-fetch-site': 'same-origin',
      },
    });

    expect(isSameOriginMutation(request)).toBe(true);
  });

  it('rejects clearly cross-site mutation requests', () => {
    const request = new Request('https://codecard.app/api/upload', {
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
        'sec-fetch-site': 'cross-site',
      },
    });

    expect(isSameOriginMutation(request)).toBe(false);
  });
});
