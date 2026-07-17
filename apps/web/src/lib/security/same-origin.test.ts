import { describe, expect, it, afterEach } from 'vitest';
import {
  collectAllowedOrigins,
  isSameOriginMutation,
  parseBrowserOrigin,
} from './same-origin';

function mutationRequest(
  url: string,
  headers: Record<string, string>,
): Request {
  return new Request(url, { method: 'POST', headers });
}

describe('WS11-T007 CSRF / same-origin guard', () => {
  const prevAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const prevVercel = process.env.VERCEL_URL;

  afterEach(() => {
    if (prevAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevAppUrl;
    if (prevVercel === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = prevVercel;
  });

  it('parses browser origins and rejects malformed values', () => {
    expect(parseBrowserOrigin('https://codecard.app')).toBe('https://codecard.app');
    expect(parseBrowserOrigin('https://codecard.app:443')).toBe('https://codecard.app');
    expect(parseBrowserOrigin('http://localhost:3000')).toBe('http://localhost:3000');
    expect(parseBrowserOrigin('null')).toBeNull();
    expect(parseBrowserOrigin('')).toBeNull();
    expect(parseBrowserOrigin('not-a-url')).toBeNull();
    expect(parseBrowserOrigin('ftp://codecard.app')).toBeNull();
    expect(parseBrowserOrigin('https://user:pass@codecard.app')).toBeNull();
  });

  it('accepts same-origin mutations', () => {
    const request = mutationRequest('https://codecard.app/api/upload', {
      origin: 'https://codecard.app',
      'sec-fetch-site': 'same-origin',
    });
    expect(isSameOriginMutation(request)).toBe(true);
  });

  it('rejects foreign Origin', () => {
    const request = mutationRequest('https://codecard.app/api/upload', {
      origin: 'https://evil.example',
      'sec-fetch-site': 'cross-site',
    });
    expect(isSameOriginMutation(request)).toBe(false);
  });

  it('rejects lookalike and subdomain confusion origins', () => {
    expect(
      isSameOriginMutation(
        mutationRequest('https://codecard.app/api/upload', {
          origin: 'https://codecard.app.evil.example',
        }),
      ),
    ).toBe(false);
    expect(
      isSameOriginMutation(
        mutationRequest('https://codecard.app/api/upload', {
          origin: 'https://evilcodecard.app',
        }),
      ),
    ).toBe(false);
    expect(
      isSameOriginMutation(
        mutationRequest('https://codecard.app/api/upload', {
          origin: 'https://not-codecard.app',
        }),
      ),
    ).toBe(false);
  });

  it('rejects wrong scheme and wrong port', () => {
    expect(
      isSameOriginMutation(
        mutationRequest('https://codecard.app/api/upload', {
          origin: 'http://codecard.app',
        }),
      ),
    ).toBe(false);
    expect(
      isSameOriginMutation(
        mutationRequest('https://codecard.app/api/upload', {
          origin: 'https://codecard.app:8443',
        }),
      ),
    ).toBe(false);
  });

  it('rejects malformed Origin even with same-origin fetch metadata', () => {
    expect(
      isSameOriginMutation(
        mutationRequest('https://codecard.app/api/upload', {
          origin: 'null',
          'sec-fetch-site': 'same-origin',
        }),
      ),
    ).toBe(false);
    expect(
      isSameOriginMutation(
        mutationRequest('https://codecard.app/api/upload', {
          origin: '://bad',
          'sec-fetch-site': 'same-origin',
        }),
      ),
    ).toBe(false);
  });

  it('rejects Sec-Fetch-Site cross-site even with matching Origin spoof attempt', () => {
    // Cross-site metadata always fails closed first.
    expect(
      isSameOriginMutation(
        mutationRequest('https://codecard.app/api/upload', {
          origin: 'https://codecard.app',
          'sec-fetch-site': 'cross-site',
        }),
      ),
    ).toBe(false);
  });

  it('rejects missing Origin and missing fetch metadata (fail closed)', () => {
    expect(
      isSameOriginMutation(mutationRequest('https://codecard.app/api/upload', {})),
    ).toBe(false);
  });

  it('accepts missing Origin when Sec-Fetch-Site is same-origin or same-site', () => {
    expect(
      isSameOriginMutation(
        mutationRequest('https://codecard.app/api/upload', {
          'sec-fetch-site': 'same-origin',
        }),
      ),
    ).toBe(true);
    expect(
      isSameOriginMutation(
        mutationRequest('https://codecard.app/api/upload', {
          'sec-fetch-site': 'same-site',
        }),
      ),
    ).toBe(true);
  });

  it('accepts configured NEXT_PUBLIC_APP_URL and VERCEL_URL hosts', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.codecard.example';
    process.env.VERCEL_URL = 'preview-abc.vercel.app';

    expect(
      isSameOriginMutation(
        mutationRequest('https://other.example/api/upload', {
          origin: 'https://app.codecard.example',
        }),
      ),
    ).toBe(true);

    expect(
      isSameOriginMutation(
        mutationRequest('https://other.example/api/upload', {
          origin: 'https://preview-abc.vercel.app',
        }),
      ),
    ).toBe(true);
  });

  it('does not authorize via untrusted Host / X-Forwarded-Host headers', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://codecard.app';
    const request = mutationRequest('https://codecard.app/api/upload', {
      origin: 'https://evil.example',
      host: 'codecard.app',
      'x-forwarded-host': 'codecard.app',
    });
    expect(isSameOriginMutation(request)).toBe(false);
    expect(collectAllowedOrigins(request).has('https://evil.example')).toBe(false);
  });
});
