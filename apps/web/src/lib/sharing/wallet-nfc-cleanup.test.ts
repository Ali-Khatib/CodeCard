import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS07-T009 remove wallet NFC stubs', () => {
  it('share hero keeps real share tools and has no wallet/NFC actions', () => {
    const hero = read('src/components/dashboard/profile-share-hero.tsx');
    expect(hero).toContain('Share profile');
    expect(hero).toContain('Copy public link');
    expect(hero).toContain('Download QR');
    expect(hero).toContain('generateProfileQrPreview');
    expect(hero).not.toMatch(/Add to wallet/i);
    expect(hero).not.toMatch(/Apple Wallet/i);
    expect(hero).not.toMatch(/Google Wallet/i);
    expect(hero).not.toMatch(/NDEFReader/);
    expect(hero).not.toMatch(/Write to NFC/i);
    expect(hero).not.toMatch(/Configure tag/i);
  });

  it('settings expose wallet/NFC as Coming later status only', () => {
    const settings = read('src/components/dashboard/dashboard-settings-view.tsx');
    expect(settings).toContain('QR & profile sharing');
    expect(settings).toContain('Coming later');
    expect(settings).toContain('Wallet passes and NFC are not part of the MVP');
    expect(settings).not.toContain('Add to Apple Wallet');
    expect(settings).not.toContain('Configure tag');
    expect(settings).not.toContain("'Download QR': 'Saved'");
    expect(settings).not.toContain("'Configure tag': 'Saved'");
    expect(settings).not.toContain("'Add to Apple Wallet': 'Added'");
  });

  it('profile editor no longer shows fake QR download success', () => {
    const profile = read('src/components/dashboard/dashboard-profile-view.tsx');
    expect(profile).toContain('Open Home share tools');
    expect(profile).toContain('Wallet and NFC are not available in the MVP');
    expect(profile).not.toContain('Download QR');
    expect(profile).not.toMatch(/grid-cols-5 grid-rows-5/);
  });

  it('repository has no NDEFReader or enabled wallet/NFC handlers in web source', () => {
    const files = [
      'src/components/dashboard/profile-share-hero.tsx',
      'src/components/dashboard/dashboard-settings-view.tsx',
      'src/components/dashboard/dashboard-profile-view.tsx',
      'src/lib/sharing/native-share.ts',
      'src/lib/sharing/qr.ts',
    ];
    for (const file of files) {
      const source = read(file);
      expect(source).not.toContain('NDEFReader');
      expect(source).not.toContain('PassKit');
      expect(source).not.toContain('google.wallet');
    }
  });
});
