import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildCanonicalPublicProfileUrl,
  generateProfileQrDownload,
  generateProfileQrPreview,
  getPublicProfileLinkForClipboard,
  readQrSegmentPayload,
} from './qr';

const testEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_APP_URL: 'https://codecard.app',
} as NodeJS.ProcessEnv;

describe('WS07-T005 public link copy verification', () => {
  it('keeps clipboard and native/canonical URL untagged while QR is tagged', async () => {
    const clipboard = getPublicProfileLinkForClipboard('jane-doe', testEnv);
    const canonical = buildCanonicalPublicProfileUrl('jane-doe', testEnv);
    const [preview, download] = await Promise.all([
      generateProfileQrPreview('jane-doe', testEnv),
      generateProfileQrDownload('jane-doe', testEnv),
    ]);

    expect(canonical.ok).toBe(true);
    expect(clipboard).toBe('https://codecard.app/jane-doe');
    if (!canonical.ok || !preview.ok || !download.ok) return;

    expect(clipboard).toBe(canonical.url);
    expect(preview.url).toBe('https://codecard.app/jane-doe?source=qr');
    expect(download.url).toBe(preview.url);
    expect(readQrSegmentPayload(preview.url)).toBe(preview.url);
    expect(clipboard).not.toContain('?');
    expect(clipboard).not.toContain('source=');
    expect(clipboard).not.toContain('/dashboard');
    expect(clipboard).not.toContain('localhost');
  });

  it('copies nothing when slug or production origin is invalid', () => {
    expect(getPublicProfileLinkForClipboard('', testEnv)).toBeNull();
    expect(getPublicProfileLinkForClipboard('Bad Slug!', testEnv)).toBeNull();
    expect(
      getPublicProfileLinkForClipboard('jane-doe', {
        NODE_ENV: 'production',
      } as NodeJS.ProcessEnv),
    ).toBeNull();
  });

  it('trims clipboard text in the copy hook', () => {
    const hook = readFileSync(
      resolve(process.cwd(), 'src/lib/hooks/use-copy-to-clipboard.ts'),
      'utf8',
    );
    expect(hook).toContain('text.trim()');
    expect(hook).toContain('Nothing to copy');
  });

  it('dashboard copy controls use the shared public URL helper', () => {
    const hero = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/profile-share-hero.tsx'),
      'utf8',
    );
    const shell = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-shell.tsx'),
      'utf8',
    );
    const header = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-profile-header.tsx'),
      'utf8',
    );
    const profileView = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-profile-view.tsx'),
      'utf8',
    );

    for (const source of [hero, shell, header, profileView]) {
      expect(source).toContain('getPublicProfileLinkForClipboard');
      expect(source).not.toContain('window.location.origin');
      expect(source).not.toContain('?source=qr');
    }

    expect(hero).toContain('Copy public link');
    expect(hero).toContain('Public link copied');
    expect(shell).toContain('Copy public link');
    expect(shell).toContain('Public link copied');
  });
});
