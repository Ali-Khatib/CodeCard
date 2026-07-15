import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertPngDataUrl,
  downloadProfileQrPng,
  hasPngSignature,
  pngDataUrlToBytes,
} from './qr-download';
import {
  generateProfileQrDownload,
  generateProfileQrPreview,
  readQrSegmentPayload,
} from './qr';

describe('WS07-T004 QR PNG download', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('validates PNG data URLs and signatures', async () => {
    const generated = await generateProfileQrDownload('jane-doe', {
      NODE_ENV: 'test',
      NEXT_PUBLIC_APP_URL: 'https://codecard.app',
    } as NodeJS.ProcessEnv);

    expect(generated.ok).toBe(true);
    if (!generated.ok) return;

    expect(assertPngDataUrl(generated.pngDataUrl)).toBe(true);
    expect(generated.filename).toBe('codecard-jane-doe-qr.png');
    expect(generated.size).toBe(1024);

    const bytes = pngDataUrlToBytes(generated.pngDataUrl);
    expect(bytes).not.toBeNull();
    expect(hasPngSignature(bytes!)).toBe(true);
    expect(bytes!.length).toBeGreaterThan(100);

    expect(assertPngDataUrl('data:image/svg+xml;base64,abc')).toBe(false);
    expect(hasPngSignature(new Uint8Array([1, 2, 3]))).toBe(false);
  });

  it('encodes the same QR-tagged URL as preview', async () => {
    const env = {
      NODE_ENV: 'test',
      NEXT_PUBLIC_APP_URL: 'https://codecard.app',
    } as NodeJS.ProcessEnv;

    const [preview, download] = await Promise.all([
      generateProfileQrPreview('jane-doe', env),
      generateProfileQrDownload('jane-doe', env),
    ]);

    expect(preview.ok && download.ok).toBe(true);
    if (!preview.ok || !download.ok) return;

    expect(preview.url).toBe('https://codecard.app/jane-doe?source=qr');
    expect(download.url).toBe(preview.url);
    expect(readQrSegmentPayload(preview.url)).toBe(preview.url);
    expect(readQrSegmentPayload(download.url)).toBe(download.url);
  });

  it('triggers one browser download and revokes the object URL', () => {
    const pngBytes = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
    ]);
    const base64 = Buffer.from(pngBytes).toString('base64');
    const pngDataUrl = `data:image/png;base64,${base64}`;

    const click = vi.fn();
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:mock-qr');
    const revokeObjectURL = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });
    vi.stubGlobal(
      'Blob',
      class {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        constructor(_parts: unknown[], _options?: { type?: string }) {}
      },
    );
    vi.stubGlobal('document', {
      createElement: () => ({
        href: '',
        download: '',
        rel: '',
        style: { display: '' },
        click,
      }),
      body: { appendChild, removeChild },
    });

    vi.useFakeTimers();
    const result = downloadProfileQrPng({
      pngDataUrl,
      filename: 'codecard-jane-doe-qr.png',
    });
    expect(result).toEqual({ ok: true, filename: 'codecard-jane-doe-qr.png' });
    expect(click).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(removeChild).toHaveBeenCalledTimes(1);

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-qr');
  });

  it('rejects unsafe filenames and invalid payloads', () => {
    expect(
      downloadProfileQrPng({
        pngDataUrl: 'data:image/png;base64,aaa',
        filename: '../evil.png',
      }).ok,
    ).toBe(false);

    expect(
      downloadProfileQrPng({
        pngDataUrl: 'not-a-png',
        filename: 'codecard-jane-doe-qr.png',
      }).ok,
    ).toBe(false);
  });
});
