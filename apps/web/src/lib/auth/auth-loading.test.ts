import { describe, it, expect } from 'vitest';
import { isAuthSubmissionBlocked, oauthButtonLabel } from '@/lib/auth/auth-loading';

describe('isAuthSubmissionBlocked', () => {
  it('blocks while email auth is pending', () => {
    expect(isAuthSubmissionBlocked({ emailPending: true, oauthPending: null })).toBe(true);
  });

  it('blocks while oauth auth is pending', () => {
    expect(
      isAuthSubmissionBlocked({ emailPending: false, oauthPending: 'google' }),
    ).toBe(true);
  });

  it('allows submission when idle', () => {
    expect(isAuthSubmissionBlocked({ emailPending: false, oauthPending: null })).toBe(false);
  });
});

describe('oauthButtonLabel', () => {
  it('shows provider-specific loading labels', () => {
    expect(oauthButtonLabel('github', 'github')).toBe('Connecting to GitHub…');
    expect(oauthButtonLabel('google', 'google')).toBe('Connecting to Google…');
  });

  it('shows idle labels when not pending', () => {
    expect(oauthButtonLabel('github', null)).toBe('Continue with GitHub');
    expect(oauthButtonLabel('google', null)).toBe('Continue with Google');
  });
});
