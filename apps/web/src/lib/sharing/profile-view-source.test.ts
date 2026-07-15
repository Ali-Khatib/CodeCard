import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_PROFILE_VIEW_SOURCE,
  parseProfileViewSource,
  readProfileViewSourceFromSearch,
} from './profile-view-source';

describe('WS07-T008 QR visit attribution', () => {
  it('maps only the approved qr source marker', () => {
    expect(parseProfileViewSource('qr')).toBe('qr');
    expect(parseProfileViewSource(null)).toBe(DEFAULT_PROFILE_VIEW_SOURCE);
    expect(parseProfileViewSource(undefined)).toBe('direct_link');
    expect(parseProfileViewSource('')).toBe('direct_link');
    expect(parseProfileViewSource('QR')).toBe('direct_link');
    expect(parseProfileViewSource(' qr')).toBe('direct_link');
    expect(parseProfileViewSource('direct_link')).toBe('direct_link');
    expect(parseProfileViewSource('nfc')).toBe('direct_link');
    expect(parseProfileViewSource('<script>')).toBe('direct_link');
    expect(parseProfileViewSource('campaign')).toBe('direct_link');
  });

  it('reads the first source query value deterministically', () => {
    expect(readProfileViewSourceFromSearch('?source=qr')).toBe('qr');
    expect(readProfileViewSourceFromSearch('source=qr')).toBe('qr');
    expect(readProfileViewSourceFromSearch('?foo=1&source=qr')).toBe('qr');
    expect(readProfileViewSourceFromSearch('?source=qr&source=nfc')).toBe('qr');
    expect(readProfileViewSourceFromSearch('?source=evil&utm=1')).toBe('direct_link');
    expect(readProfileViewSourceFromSearch('')).toBe('direct_link');
    expect(readProfileViewSourceFromSearch(null)).toBe('direct_link');
  });

  it('wires ProfileAnalytics to the strict source parser without referrers', () => {
    const component = readFileSync(
      resolve(process.cwd(), 'src/components/profile-analytics.tsx'),
      'utf8',
    );
    expect(component).toContain('readProfileViewSourceFromSearch');
    expect(component).toContain("event_type: 'profile_view'");
    expect(component).not.toContain("source: 'direct_link'");
    expect(component).not.toContain('referrer');
    expect(component).not.toContain('document.referrer');
  });
});
