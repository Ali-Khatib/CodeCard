import { describe, expect, it } from 'vitest';
import {
  encodeContentPrefixBase64,
  validateUploadContentPrefix,
} from './upload-content-prefix';

function pngPrefix(): string {
  return encodeContentPrefixBase64(
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
}

function jpegPrefix(): string {
  return encodeContentPrefixBase64(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]));
}

describe('validateUploadContentPrefix', () => {
  it('accepts PNG magic that matches declared MIME', () => {
    expect(
      validateUploadContentPrefix({
        mimeType: 'image/png',
        contentPrefixBase64: pngPrefix(),
      }),
    ).toEqual({ ok: true });
  });

  it('rejects HTML masquerading as PNG', () => {
    const html = encodeContentPrefixBase64(new TextEncoder().encode('<html><body>'));
    const result = validateUploadContentPrefix({
      mimeType: 'image/png',
      contentPrefixBase64: html,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(415);
    }
  });

  it('rejects JPEG bytes declared as PNG', () => {
    const result = validateUploadContentPrefix({
      mimeType: 'image/png',
      contentPrefixBase64: jpegPrefix(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(415);
    }
  });

  it('rejects empty or invalid base64', () => {
    expect(
      validateUploadContentPrefix({
        mimeType: 'image/png',
        contentPrefixBase64: '!!!',
      }).ok,
    ).toBe(false);
  });
});
