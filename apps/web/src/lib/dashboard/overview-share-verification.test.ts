import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T007 overview share controls', () => {
  it('Overview hosts share tools plus identity editing with a live CodeCard preview', () => {
    const overview = read('src/components/dashboard/dashboard-overview-view.tsx');
    const preview = read('src/components/dashboard/home-codecard-preview.tsx');
    const hero = read('src/components/dashboard/profile-share-hero.tsx');

    expect(overview).toContain('HomeIdentitySection');
    expect(overview).toContain("import { ProfileShareHero } from './profile-share-hero'");
    expect(overview).toContain('<ProfileShareHero');
    expect(overview).not.toContain('navigator.share');
    expect(overview).not.toContain('buildCanonicalPublicProfileUrl');
    expect(overview).not.toMatch(/\bwallet\b/i);
    expect(overview).not.toMatch(/\bnfc\b/i);

    expect(preview).toContain('View CodeCard');
    expect(preview).not.toContain('QR Code');
    expect(preview).not.toContain('generateProfileQrPreview');
    expect(preview).not.toContain('Copy link');

    expect(hero).toContain('buildCanonicalPublicProfileUrl');
    expect(hero).toContain('generateProfileQrPreview');
    expect(hero).not.toMatch(/\bwallet\b/i);
    expect(hero).not.toMatch(/\bnfc\b/i);
  });

  it('preserves canonical vs QR URL contract in sharing helpers', () => {
    const qr = read('src/lib/sharing/qr.ts');
    const native = read('src/lib/sharing/native-share.ts');

    expect(qr).toContain('buildCanonicalPublicProfileUrl');
    expect(qr).toContain('buildQrProfileUrl');
    expect(qr).toContain("parsed.searchParams.set('source', 'qr')");
    expect(native).toContain('getPublicProfileLinkForClipboard');
    expect(native).not.toContain('buildQrProfileUrl');
    expect(native).not.toContain("searchParams.set('source'");
  });
});
