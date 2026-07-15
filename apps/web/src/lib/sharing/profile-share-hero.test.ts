import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('WS07-T003 dashboard QR preview', () => {
  it('replaces QrPattern with live generateProfileQrPreview output', () => {
    const hero = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/profile-share-hero.tsx'),
      'utf8',
    );
    const overview = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-overview-view.tsx'),
      'utf8',
    );

    expect(hero).not.toContain('function QrPattern');
    expect(hero).not.toContain('cc-share-qr-pattern');
    expect(hero).toContain('generateProfileQrPreview');
    expect(hero).toContain('buildCanonicalPublicProfileUrl');
    expect(hero).toContain('QR code for public CodeCard profile');
    expect(hero).toContain('isPublic');
    expect(hero).toContain('publish your profile');
    expect(hero).toContain('aria-live="polite"');
    expect(overview).toContain('isPublic={profile?.is_public');
  });

  it('does not use remote QR generation services for the dashboard share panel', () => {
    const hero = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/profile-share-hero.tsx'),
      'utf8',
    );
    expect(hero).not.toContain('api.qrserver.com');
    expect(hero).not.toContain('chart.googleapis.com');
  });
});
