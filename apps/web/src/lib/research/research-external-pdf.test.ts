import { describe, expect, it } from 'vitest';
import {
  describeExternalPdfSource,
  sanitizeExternalPdfUrlForPersist,
} from './research-external-pdf';

describe('research external PDF helpers', () => {
  it('describes externally hosted HTTPS links', () => {
    expect(describeExternalPdfSource('https://arxiv.org/pdf/1706.03762.pdf')).toBe(
      'Externally hosted · arxiv.org',
    );
    expect(describeExternalPdfSource(null)).toBeNull();
    expect(describeExternalPdfSource('http://insecure.example/paper.pdf')).toBeNull();
  });

  it('sanitizes persistable external PDF URLs', () => {
    expect(sanitizeExternalPdfUrlForPersist('  https://example.com/a.pdf  ')).toEqual({
      ok: true,
      value: 'https://example.com/a.pdf',
    });
    expect(sanitizeExternalPdfUrlForPersist('')).toEqual({ ok: true, value: null });
    expect(sanitizeExternalPdfUrlForPersist('javascript:alert(1)').ok).toBe(false);
    expect(sanitizeExternalPdfUrlForPersist('https://user:secret@host/x.pdf').ok).toBe(false);
  });
});
