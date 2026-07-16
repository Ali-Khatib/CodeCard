import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T007 overview share controls', () => {
  it('Overview reuses ProfileShareHero with trusted profile props only', () => {
    const overview = read('src/components/dashboard/dashboard-overview-view.tsx');
    const hero = read('src/components/dashboard/profile-share-hero.tsx');

    expect(overview).toContain("import { ProfileShareHero } from './profile-share-hero'");
    expect(overview).toContain('<ProfileShareHero');
    expect(overview).toContain('profileSlug={profileSlug}');
    expect(overview).toContain('profileId={profile?.id}');
    expect(overview).toContain('isPublic={profile?.is_public ?? true}');
    expect(overview).toContain('displayName={displayName}');

    expect(overview).not.toContain('generateProfileQrPreview');
    expect(overview).not.toContain('navigator.share');
    expect(overview).not.toContain('buildCanonicalPublicProfileUrl');
    expect(overview).not.toMatch(/\bwallet\b/i);
    expect(overview).not.toMatch(/\bnfc\b/i);

    expect(hero).toContain('buildCanonicalPublicProfileUrl');
    expect(hero).toContain('generateProfileQrPreview');
    expect(hero).toContain('generateProfileQrDownload');
    expect(hero).toContain('downloadProfileQrPng');
    expect(hero).toContain('shareProfileNative');
    expect(hero).toContain('getPublicProfileLinkForClipboard');
    expect(hero).toContain('trackProfileShareEvent');
    expect(hero).toContain('trackQrDownloadEvent');
    expect(hero).toContain('isPublic');
    expect(hero).toContain('publish your profile');
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
