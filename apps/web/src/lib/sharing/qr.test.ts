import { describe, expect, it } from 'vitest';
import {
  buildCanonicalPublicProfileUrl,
  buildProfileQrFilename,
  buildQrProfileUrl,
  generateProfileQr,
  generateProfileQrDownload,
  generateProfileQrPreview,
  getPublicProfileLinkForClipboard,
  getTrustedAppOrigin,
  normalizeTrustedAppOrigin,
  PROFILE_QR_DOWNLOAD_SIZE,
  PROFILE_QR_MARGIN,
  PROFILE_QR_PREVIEW_SIZE,
  readQrSegmentPayload,
} from './qr';

const TEST_ENV = {
  NEXT_PUBLIC_APP_URL: 'https://app.codecard.test/',
  NODE_ENV: 'test',
} as NodeJS.ProcessEnv;

describe('canonical public profile URL', () => {
  it('normalizes trusted origins and rejects unsafe values', () => {
    expect(normalizeTrustedAppOrigin('https://app.codecard.test/')).toBe(
      'https://app.codecard.test',
    );
    expect(normalizeTrustedAppOrigin('http://localhost:3000')).toBe('http://localhost:3000');
    expect(normalizeTrustedAppOrigin('javascript:alert(1)')).toBeNull();
    expect(normalizeTrustedAppOrigin('ftp://example.com')).toBeNull();
    expect(normalizeTrustedAppOrigin('https://user:pass@example.com')).toBeNull();
    expect(normalizeTrustedAppOrigin('https://example.com/path')).toBeNull();
  });

  it('builds a deterministic absolute profile URL from trusted config', () => {
    const result = buildCanonicalPublicProfileUrl('Ada-Lovelace', TEST_ENV);
    expect(result).toEqual({
      ok: true,
      origin: 'https://app.codecard.test',
      slug: 'ada-lovelace',
      url: 'https://app.codecard.test/ada-lovelace',
    });
  });

  it('rejects empty/malformed slugs and missing production origin', () => {
    expect(buildCanonicalPublicProfileUrl('', TEST_ENV).ok).toBe(false);
    expect(buildCanonicalPublicProfileUrl('../evil', TEST_ENV).ok).toBe(false);
    expect(
      buildCanonicalPublicProfileUrl('ada', {
        NODE_ENV: 'production',
      } as NodeJS.ProcessEnv).ok,
    ).toBe(false);
    expect(getTrustedAppOrigin({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBe(
      'http://localhost:3000',
    );
  });

  it('never includes tracking params, emails, or ownership fields', () => {
    const result = buildCanonicalPublicProfileUrl('ada', TEST_ENV);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.url).not.toContain('?');
    expect(result.url).not.toContain('source=');
    expect(result.url).not.toContain('@');
    expect(result.url).not.toContain('tenant');
    expect(result.url).not.toContain('user_id');
  });
});

describe('profile QR generation', () => {
  it('generates deterministic PNG and SVG for the QR-tagged profile URL', async () => {
    const preview = await generateProfileQrPreview('ada', TEST_ENV);
    const again = await generateProfileQrPreview('ada', TEST_ENV);
    expect(preview.ok).toBe(true);
    expect(again.ok).toBe(true);
    if (!preview.ok || !again.ok) return;

    expect(preview.url).toBe('https://app.codecard.test/ada?source=qr');
    expect(preview.pngDataUrl).toBe(again.pngDataUrl);
    expect(preview.svg).toBe(again.svg);
    expect(preview.pngDataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(preview.svg).toContain('<svg');
    expect(preview.size).toBe(PROFILE_QR_PREVIEW_SIZE);
    expect(preview.filename).toBe('codecard-ada-qr.png');
    expect(readQrSegmentPayload(preview.url)).toBe(preview.url);
    expect(getPublicProfileLinkForClipboard('ada', TEST_ENV)).toBe(
      'https://app.codecard.test/ada',
    );
  });

  it('keeps preview and download QR payloads identical and tagged once', async () => {
    const preview = await generateProfileQrPreview('ada-lovelace', TEST_ENV);
    const download = await generateProfileQrDownload('ada-lovelace', TEST_ENV);
    expect(preview.ok && download.ok).toBe(true);
    if (!preview.ok || !download.ok) return;

    expect(preview.url).toBe(download.url);
    expect(preview.url).toBe('https://app.codecard.test/ada-lovelace?source=qr');
    expect(preview.url.match(/source=qr/g)?.length).toBe(1);
    expect(readQrSegmentPayload(preview.url)).toBe(download.url);
    expect(download.size).toBe(PROFILE_QR_DOWNLOAD_SIZE);
    expect(download.filename).toBe(buildProfileQrFilename('ada-lovelace'));
  });

  it('builds QR URLs without duplicating the source marker', () => {
    expect(buildQrProfileUrl('https://app.codecard.test/ada')).toBe(
      'https://app.codecard.test/ada?source=qr',
    );
    expect(buildQrProfileUrl('https://app.codecard.test/ada?source=qr')).toBe(
      'https://app.codecard.test/ada?source=qr',
    );
    expect(buildQrProfileUrl('https://app.codecard.test/ada?source=direct_link')).toBe(
      'https://app.codecard.test/ada?source=qr',
    );
    expect(buildQrProfileUrl('javascript:alert(1)')).toBeNull();
  });

  it('uses a quiet zone and high-contrast modules', async () => {
    const result = await generateProfileQr(
      'ada',
      { size: 256, margin: PROFILE_QR_MARGIN },
      TEST_ENV,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.svg).toContain('viewBox');
    // white background + dark modules from approved palette
    expect(result.svg.toLowerCase()).toMatch(/#fff|#ffffff|rgb\(255,\s*255,\s*255\)/);
    expect(PROFILE_QR_MARGIN).toBeGreaterThanOrEqual(4);
  });

  it('rejects missing slug without fabricating output', async () => {
    const result = await generateProfileQr(null, undefined, TEST_ENV);
    expect(result).toEqual({
      ok: false,
      error: 'A valid public profile slug is required.',
    });
  });

  it('handles long valid production-like profile URLs', async () => {
    const slug = 'a'.repeat(30);
    const result = await generateProfileQrPreview(slug, {
      NEXT_PUBLIC_APP_URL: 'https://codecard.app',
      NODE_ENV: 'production',
    } as NodeJS.ProcessEnv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.url).toBe(`https://codecard.app/${slug}?source=qr`);
    expect(readQrSegmentPayload(result.url)).toBe(result.url);
  });
});
