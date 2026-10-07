import { describe, expect, it } from 'vitest';
import {
  SESSION_LEASE_CLOSE_MAX_AGE_SECONDS,
  SESSION_LEASE_COOKIE,
  hasSessionLease,
  serializeSessionLeaseCookie,
  supabaseAuthCookieNames,
} from './session-lease';

describe('session lease', () => {
  it('treats only a non-empty lease cookie as an open tab', () => {
    expect(hasSessionLease([{ name: SESSION_LEASE_COOKIE, value: '1' }])).toBe(true);
    expect(hasSessionLease([{ name: SESSION_LEASE_COOKIE, value: '' }])).toBe(false);
    expect(hasSessionLease([{ name: 'sb-ref-auth-token', value: 'jwt' }])).toBe(false);
  });

  it('writes a short-lived cookie and a tighter one when the last tab closes', () => {
    expect(serializeSessionLeaseCookie()).toContain(`${SESSION_LEASE_COOKIE}=1`);
    expect(serializeSessionLeaseCookie()).toContain('Max-Age=20');
    expect(serializeSessionLeaseCookie()).not.toMatch(/HttpOnly/i);
    expect(serializeSessionLeaseCookie(SESSION_LEASE_CLOSE_MAX_AGE_SECONDS)).toContain(
      'Max-Age=3',
    );
  });

  it('finds chunked Supabase auth cookies', () => {
    expect(
      supabaseAuthCookieNames([
        { name: 'sb-ref-auth-token.0' },
        { name: 'sb-ref-auth-token.1' },
        { name: 'cc-theme' },
      ]),
    ).toEqual(['sb-ref-auth-token.0', 'sb-ref-auth-token.1']);
  });
});
