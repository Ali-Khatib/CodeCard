import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  buildProfileNativeSharePayload,
  canShareProfilePayload,
  isNativeShareSupported,
  isShareCancellation,
  sanitizeSharePlainText,
  shareProfileNative,
} from './native-share';
import {
  generateProfileQrDownload,
  generateProfileQrPreview,
  getPublicProfileLinkForClipboard,
} from './qr';

const testEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_APP_URL: 'https://codecard.app',
} as NodeJS.ProcessEnv;

describe('WS07-T006 native profile sharing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sanitizes plain-text share fields', () => {
    expect(sanitizeSharePlainText('  Ada\u0000\nChen  ', 80)).toBe('Ada Chen');
    expect(sanitizeSharePlainText('a'.repeat(200), 12)).toBe('aaaaaaaaaaaa');
  });

  it('builds a safe payload with the canonical public URL', async () => {
    const built = buildProfileNativeSharePayload({
      displayName: 'Ada Lovelace',
      profileSlug: 'ada-lovelace',
      env: testEnv,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const clipboard = getPublicProfileLinkForClipboard('ada-lovelace', testEnv);
    const preview = await generateProfileQrPreview('ada-lovelace', testEnv);
    const download = await generateProfileQrDownload('ada-lovelace', testEnv);

    expect(built.payload.url).toBe('https://codecard.app/ada-lovelace');
    expect(built.payload.url).toBe(clipboard);
    expect(preview.ok && preview.url).toBe('https://codecard.app/ada-lovelace?source=qr');
    expect(download.ok && download.url).toBe(preview.ok ? preview.url : '');
    expect(built.payload.title).toBe('Ada Lovelace on CodeCard');
    expect(built.payload.text).toBe('View my public CodeCard profile.');
    expect(built.payload.url).not.toContain('?');
    expect(built.payload.url).not.toContain('source=');
    expect(built.payload.title).not.toContain('@');
    expect(JSON.stringify(built.payload)).not.toContain('tenant');
    expect(JSON.stringify(built.payload)).not.toContain('user_id');
  });

  it('blocks missing slug and production misconfiguration', () => {
    expect(
      buildProfileNativeSharePayload({
        displayName: 'Ada',
        profileSlug: '',
        env: testEnv,
      }).ok,
    ).toBe(false);

    expect(
      buildProfileNativeSharePayload({
        displayName: 'Ada',
        profileSlug: 'ada',
        env: { NODE_ENV: 'production' } as NodeJS.ProcessEnv,
      }).ok,
    ).toBe(false);
  });

  it('feature-detects native share without user-agent sniffing', () => {
    expect(isNativeShareSupported({ share: undefined } as unknown as Navigator)).toBe(false);
    expect(
      isNativeShareSupported({
        share: async () => undefined,
      } as unknown as Navigator),
    ).toBe(true);
  });

  it('shares once with the exact payload and treats AbortError as cancellation', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const nav = { share, canShare: () => true } as unknown as Navigator;
    const built = buildProfileNativeSharePayload({
      displayName: 'Ada',
      profileSlug: 'ada',
      env: testEnv,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    expect(canShareProfilePayload(built.payload, nav)).toBe(true);
    await expect(shareProfileNative(built.payload, nav)).resolves.toEqual({
      ok: true,
      status: 'shared',
    });
    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith({
      title: built.payload.title,
      text: built.payload.text,
      url: built.payload.url,
    });

    const abort = Object.assign(new Error('share aborted'), { name: 'AbortError' });
    expect(isShareCancellation(abort)).toBe(true);
    share.mockRejectedValueOnce(abort);
    await expect(shareProfileNative(built.payload, nav)).resolves.toEqual({
      ok: true,
      status: 'cancelled',
    });

    share.mockRejectedValueOnce(new Error('boom'));
    await expect(shareProfileNative(built.payload, nav)).resolves.toEqual({
      ok: false,
      error: 'Could not open sharing options. Try copying your public link instead.',
    });
  });

  it('reports unsupported browsers clearly', async () => {
    const built = buildProfileNativeSharePayload({
      displayName: 'Ada',
      profileSlug: 'ada',
      env: testEnv,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    await expect(shareProfileNative(built.payload, null)).resolves.toEqual({
      ok: false,
      error: 'Native sharing is not available in this browser.',
    });
  });
});
