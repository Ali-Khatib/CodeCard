import { describe, expect, it } from 'vitest';
import {
  serializeSessionCookie,
  toSessionOnlyCookieOptions,
} from './session-cookie-options';

describe('toSessionOnlyCookieOptions', () => {
  it('strips persistent maxAge / expires for live session cookies', () => {
    const opts = toSessionOnlyCookieOptions(
      { maxAge: 60 * 60 * 24 * 400, expires: new Date(), path: '/dashboard', name: 'sb-x' },
      'token',
    );
    expect(opts.maxAge).toBeUndefined();
    expect(opts.expires).toBeUndefined();
    expect(opts.name).toBeUndefined();
    expect(opts.path).toBe('/dashboard');
  });

  it('keeps maxAge 0 when clearing cookies', () => {
    const opts = toSessionOnlyCookieOptions({ maxAge: 400 }, '');
    expect(opts.maxAge).toBe(0);
  });
});

describe('serializeSessionCookie', () => {
  it('omits Max-Age for session cookies and includes it when clearing', () => {
    const live = serializeSessionCookie('sb-auth', 'abc', { maxAge: 99999 });
    expect(live).toContain('sb-auth=abc');
    expect(live).not.toMatch(/Max-Age=/i);

    const clear = serializeSessionCookie('sb-auth', '', { maxAge: 0 });
    expect(clear).toContain('Max-Age=0');
  });
});
