import { describe, expect, it } from 'vitest';
import {
  detectImageMimeFromMagicBytes,
  looksLikeActiveOrNonImageContent,
  looksLikePdfMagic,
  mimeMatchesDetected,
} from './content-signature';

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

describe('content-signature', () => {
  it('detects JPEG / PNG / WebP magic bytes', () => {
    expect(detectImageMimeFromMagicBytes(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(
      detectImageMimeFromMagicBytes(
        bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
      ),
    ).toBe('image/png');
    expect(
      detectImageMimeFromMagicBytes(
        bytes(
          0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0, 0, 0, 0,
        ),
      ),
    ).toBe('image/webp');
  });

  it('rejects HTML/SVG/PDF masquerading as images', () => {
    expect(looksLikeActiveOrNonImageContent(new TextEncoder().encode('<html>'))).toBe(true);
    expect(looksLikeActiveOrNonImageContent(new TextEncoder().encode('<svg xmlns'))).toBe(true);
    expect(looksLikeActiveOrNonImageContent(new TextEncoder().encode('%PDF-1.4'))).toBe(true);
    expect(
      looksLikeActiveOrNonImageContent(bytes(0xff, 0xd8, 0xff, 0xe0)),
    ).toBe(false);
  });

  it('requires declared MIME to match detected magic', () => {
    expect(mimeMatchesDetected('image/png', 'image/png')).toBe(true);
    expect(mimeMatchesDetected('image/jpg', 'image/jpeg')).toBe(true);
    expect(mimeMatchesDetected('image/png', 'image/jpeg')).toBe(false);
    expect(mimeMatchesDetected('image/png', null)).toBe(false);
  });

  it('detects PDF magic for hosted-PDF policy helpers', () => {
    expect(looksLikePdfMagic(new TextEncoder().encode('%PDF-1.7'))).toBe(true);
    expect(looksLikePdfMagic(new TextEncoder().encode('<html>'))).toBe(false);
  });
});
