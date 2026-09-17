import { describe, expect, it } from 'vitest';
import {
  buildCanonicalPublicProfileUrl,
  buildQrProfileUrl,
  getPublicProfileLinkForShare,
  parseScannedCodeCardUrl,
} from './public-codecard-url';

const ORIGIN = 'https://app.codecard.test';

describe('mobile public CodeCard URL contract', () => {
  it('share URLs are canonical public cards without source=qr or dashboard', () => {
    const share = getPublicProfileLinkForShare('ada-lovelace', ORIGIN);
    expect(share).toBe('https://app.codecard.test/ada-lovelace');
    expect(share).not.toContain('source=qr');
    expect(share).not.toContain('/dashboard');
    expect(share).not.toMatch(/\/app(?:\/|$|\?)/);
  });

  it('QR URLs append a single source=qr marker on the public CodeCard', () => {
    const canonical = buildCanonicalPublicProfileUrl('ada-lovelace', ORIGIN);
    expect(canonical.ok).toBe(true);
    if (!canonical.ok) return;
    const qr = buildQrProfileUrl(canonical.url);
    expect(qr).toBe('https://app.codecard.test/ada-lovelace?source=qr');
    expect(qr?.match(/source=qr/g)?.length).toBe(1);
    expect(qr).not.toContain('/dashboard');
  });

  it('parses a scanned public CodeCard QR and rejects dashboard or marketing destinations', () => {
    const scanned = parseScannedCodeCardUrl(
      'https://app.codecard.test/bob-smith?source=qr',
      ORIGIN,
    );
    expect(scanned).toEqual({
      ok: true,
      slug: 'bob-smith',
      fromQr: true,
      publicUrl: 'https://app.codecard.test/bob-smith',
    });

    expect(parseScannedCodeCardUrl('https://app.codecard.test/dashboard', ORIGIN).ok).toBe(
      false,
    );
    expect(parseScannedCodeCardUrl('https://app.codecard.test/app', ORIGIN).ok).toBe(false);
    expect(parseScannedCodeCardUrl('https://app.codecard.test/', ORIGIN).ok).toBe(false);
    expect(
      parseScannedCodeCardUrl('https://evil.example/bob-smith?source=qr', ORIGIN).ok,
    ).toBe(false);
  });

  it('does not treat an untagged share link as an in-person QR connection', () => {
    const scanned = parseScannedCodeCardUrl('https://app.codecard.test/bob-smith', ORIGIN);
    expect(scanned.ok).toBe(true);
    if (!scanned.ok) return;
    expect(scanned.fromQr).toBe(false);
    expect(scanned.slug).toBe('bob-smith');
  });
});
