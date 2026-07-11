import { describe, expect, it } from 'vitest';
import { extractUploadExtension, validateUploadMetadata } from './upload-validation';

describe('validateUploadMetadata', () => {
  it('accepts valid avatar metadata', () => {
    const result = validateUploadMetadata({
      resourceType: 'avatar',
      filename: 'avatar.png',
      mimeType: 'image/png',
      size: 1024,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.extension).toBe('png');
      expect(result.maxBytes).toBe(5 * 1024 * 1024);
    }
  });

  it('rejects zero-byte files', () => {
    const result = validateUploadMetadata({
      resourceType: 'avatar',
      filename: 'avatar.png',
      mimeType: 'image/png',
      size: 0,
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: 'File size must be greater than zero.',
    });
  });

  it('rejects oversized files', () => {
    const result = validateUploadMetadata({
      resourceType: 'avatar',
      filename: 'avatar.png',
      mimeType: 'image/png',
      size: 6 * 1024 * 1024,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
    }
  });

  it('rejects unsupported MIME types and unsafe extensions', () => {
    expect(
      validateUploadMetadata({
        resourceType: 'avatar',
        filename: 'avatar.svg',
        mimeType: 'image/svg+xml',
        size: 100,
      }).ok,
    ).toBe(false);

    expect(
      validateUploadMetadata({
        resourceType: 'avatar',
        filename: 'avatar.html',
        mimeType: 'text/html',
        size: 100,
      }).ok,
    ).toBe(false);
  });

  it('rejects MIME and extension mismatches', () => {
    const result = validateUploadMetadata({
      resourceType: 'avatar',
      filename: 'avatar.png',
      mimeType: 'image/jpeg',
      size: 100,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(415);
    }
  });

  it('rejects traversal filenames and double extensions', () => {
    expect(extractUploadExtension('../avatar.png')).toBeNull();
    expect(extractUploadExtension('avatar.pdf.exe')).toBeNull();
    expect(extractUploadExtension('avatar')).toBeNull();
  });
});
