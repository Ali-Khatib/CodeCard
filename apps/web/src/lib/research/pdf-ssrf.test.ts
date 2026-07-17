import { describe, expect, it } from 'vitest';
import {
  PUBLIC_RESEARCH_PDF_MAX_BYTES,
  PUBLIC_RESEARCH_PDF_MAX_REDIRECTS,
  PUBLIC_RESEARCH_PDF_TIMEOUT_MS,
  assertSafePublicPdfUrl,
  isAcceptablePdfContentType,
  isBlockedHostnameOrIp,
  looksLikePdfBytes,
} from '@/lib/research/pdf-ssrf';

describe('pdf-ssrf hardening', () => {
  it('accepts safe https URLs', () => {
    expect(assertSafePublicPdfUrl('https://arxiv.org/pdf/1234.pdf').hostname).toBe('arxiv.org');
  });

  it('rejects http, credentials, localhost, loopback, private, and metadata hosts', () => {
    const blocked = [
      'http://example.com/a.pdf',
      'https://user:pass@example.com/a.pdf',
      'https://localhost/a.pdf',
      'https://127.0.0.1/a.pdf',
      'https://10.0.0.1/a.pdf',
      'https://192.168.1.1/a.pdf',
      'https://172.16.0.1/a.pdf',
      'https://169.254.169.254/latest/meta-data',
      'https://metadata.google.internal/',
      'https://[::1]/a.pdf',
      'ftp://example.com/a.pdf',
    ];
    for (const url of blocked) {
      expect(() => assertSafePublicPdfUrl(url)).toThrow();
    }
  });

  it('blocks private hostnames and IPs via helper', () => {
    expect(isBlockedHostnameOrIp('localhost')).toBe(true);
    expect(isBlockedHostnameOrIp('127.0.0.1')).toBe(true);
    expect(isBlockedHostnameOrIp('10.1.2.3')).toBe(true);
    expect(isBlockedHostnameOrIp('169.254.169.254')).toBe(true);
    expect(isBlockedHostnameOrIp('arxiv.org')).toBe(false);
  });

  it('validates PDF magic bytes and content types', () => {
    expect(looksLikePdfBytes(new TextEncoder().encode('%PDF-1.4\n'))).toBe(true);
    expect(looksLikePdfBytes(new TextEncoder().encode('<html>'))).toBe(false);
    expect(isAcceptablePdfContentType('application/pdf')).toBe(true);
    expect(isAcceptablePdfContentType('text/html')).toBe(false);
    expect(isAcceptablePdfContentType(null)).toBe(true);
  });

  it('exposes bounded limits', () => {
    expect(PUBLIC_RESEARCH_PDF_MAX_BYTES).toBe(25 * 1024 * 1024);
    expect(PUBLIC_RESEARCH_PDF_TIMEOUT_MS).toBe(12_000);
    expect(PUBLIC_RESEARCH_PDF_MAX_REDIRECTS).toBe(3);
  });
});
