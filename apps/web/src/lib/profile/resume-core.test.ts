import { describe, expect, it } from 'vitest';
import {
  assertOwnedResumeStoragePath,
  buildPublicResumePath,
  buildResumeStoragePath,
  validateResumeUploadMeta,
} from '@/lib/profile/resume-core';

describe('resume-core', () => {
  const userId = 'f0aeb4f9-b5e3-4805-b1ec-22c413922b78';

  it('builds a stable owner resume path', () => {
    expect(buildResumeStoragePath(userId)).toBe(`${userId}/cv.pdf`);
  });

  it('builds a public resume path from a slug', () => {
    expect(buildPublicResumePath('Ali-The-Founder')).toBe('/ali-the-founder/resume');
    expect(buildPublicResumePath('../x')).toBeNull();
  });

  it('rejects paths that do not belong to the owner', () => {
    expect(assertOwnedResumeStoragePath(`${userId}/cv.pdf`, userId).ok).toBe(true);
    expect(assertOwnedResumeStoragePath('other/cv.pdf', userId).ok).toBe(false);
    expect(assertOwnedResumeStoragePath(`${userId}/../cv.pdf`, userId).ok).toBe(false);
  });

  it('accepts PDF magic + size within limit', () => {
    const prefix = new TextEncoder().encode('%PDF-1.4');
    expect(
      validateResumeUploadMeta({
        mimeType: 'application/pdf',
        size: 1024,
        contentPrefix: prefix,
      }).ok,
    ).toBe(true);
  });

  it('rejects non-PDF content', () => {
    const prefix = new TextEncoder().encode('<html>');
    const result = validateResumeUploadMeta({
      mimeType: 'application/pdf',
      size: 1024,
      contentPrefix: prefix,
    });
    expect(result.ok).toBe(false);
  });
});
