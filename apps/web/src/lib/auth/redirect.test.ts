import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authCallbackRedirectUrl, sanitizeInternalRedirect } from '@/lib/auth/redirect';

describe('sanitizeInternalRedirect', () => {
  it('allows safe internal paths', () => {
    expect(sanitizeInternalRedirect('/dashboard')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('/dashboard?tab=projects')).toBe('/dashboard?tab=projects');
    expect(sanitizeInternalRedirect('/settings')).toBe('/settings');
    expect(sanitizeInternalRedirect('/reset-password')).toBe('/reset-password');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(sanitizeInternalRedirect('https://evil.example')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('//evil.example')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('/\\evil')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('/@evil.example')).toBe('/dashboard');
  });

  it('rejects encoded external URLs', () => {
    expect(sanitizeInternalRedirect('%2F%2Fevil.example')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('/%2F%2Fevil.example')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('/https%3A%2F%2Fevil.example')).toBe('/dashboard');
  });

  it('rejects dangerous schemes and malformed values', () => {
    expect(sanitizeInternalRedirect('javascript:alert(1)')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('/javascript:alert(1)')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('   ')).toBe('/dashboard');
    expect(sanitizeInternalRedirect(null)).toBe('/dashboard');
    expect(sanitizeInternalRedirect(undefined)).toBe('/dashboard');
  });

  it('rejects auth-loop destinations', () => {
    expect(sanitizeInternalRedirect('/sign-in')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('/sign-up?plan=pro')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('/auth/callback?redirect=/dashboard')).toBe('/dashboard');
    expect(sanitizeInternalRedirect('/auth/error')).toBe('/dashboard');
  });

  it('falls back safely when redirect is missing', () => {
    expect(sanitizeInternalRedirect(null)).toBe('/dashboard');
    expect(sanitizeInternalRedirect('', '/settings')).toBe('/settings');
  });
});

describe('authCallbackRedirectUrl', () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.codecard.test';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it('builds same-origin callback URLs without leaking tokens', () => {
    const url = authCallbackRedirectUrl('/dashboard?tab=projects');
    expect(url).toBe(
      'https://app.codecard.test/auth/callback?redirect=%2Fdashboard%3Ftab%3Dprojects',
    );
    expect(url).not.toMatch(/access_token|refresh_token|code=/);
  });

  it('rejects unsafe redirect targets in callback URLs', () => {
    const url = authCallbackRedirectUrl('https://evil.example');
    expect(url).toBe('https://app.codecard.test/auth/callback?redirect=%2Fdashboard');
  });
});
