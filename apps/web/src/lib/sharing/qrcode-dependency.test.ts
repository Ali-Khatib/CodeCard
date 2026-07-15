import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';

/**
 * WS07-T001: verify the approved local QR dependency resolves without a remote service.
 */
describe('WS07-T001 qrcode dependency', () => {
  it('imports the local qrcode package and generates offline', async () => {
    const dataUrl = await QRCode.toDataURL('https://example.test/profile', {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: { dark: '#000000', light: '#ffffff' },
    });

    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(100);
  });

  it('exposes segment-level payload for offline verification', () => {
    const url = 'https://example.test/ada';
    const created = QRCode.create(url, { errorCorrectionLevel: 'M' });
    const bytes = created.segments.flatMap((segment) => {
      const data = segment.data;
      if (typeof data === 'string') return Array.from(new TextEncoder().encode(data));
      return Array.from(data as Uint8Array | number[]);
    });
    expect(new TextDecoder().decode(Uint8Array.from(bytes))).toBe(url);
  });
});
