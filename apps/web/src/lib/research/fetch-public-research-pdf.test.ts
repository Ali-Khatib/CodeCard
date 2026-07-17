import { describe, expect, it, vi } from 'vitest';
import { fetchPublicResearchPdf } from '@/lib/research/fetch-public-research-pdf';

const PDF_BYTES = new TextEncoder().encode('%PDF-1.4\n%fixture\n');

function pdfResponse(body: BodyInit, init?: ResponseInit) {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/pdf', ...(init?.headers ?? {}) },
    ...init,
  });
}

describe('fetchPublicResearchPdf', () => {
  it('streams a valid HTTPS PDF', async () => {
    const fetchImpl = vi.fn(async () => pdfResponse(PDF_BYTES));
    const result = await fetchPublicResearchPdf('https://cdn.example.com/paper.pdf', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      skipDnsLookup: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contentType).toBe('application/pdf');
      expect(looksLikePdf(result.bytes)).toBe(true);
    }
  });

  it('rejects HTTP URLs', async () => {
    const result = await fetchPublicResearchPdf('http://example.com/a.pdf', {
      skipDnsLookup: true,
    });
    expect(result).toEqual({ ok: false, reason: 'invalid_url' });
  });

  it('rejects localhost', async () => {
    const result = await fetchPublicResearchPdf('https://localhost/a.pdf', {
      skipDnsLookup: true,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects private IP literals', async () => {
    const result = await fetchPublicResearchPdf('https://10.0.0.8/a.pdf', {
      skipDnsLookup: true,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects metadata endpoints', async () => {
    const result = await fetchPublicResearchPdf('https://169.254.169.254/latest/meta-data', {
      skipDnsLookup: true,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects unsafe redirects', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: { location: 'http://evil.example/a.pdf' },
      }),
    );
    const result = await fetchPublicResearchPdf('https://cdn.example.com/paper.pdf', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      skipDnsLookup: true,
    });
    expect(result).toEqual({ ok: false, reason: 'blocked_host' });
  });

  it('rejects too many redirects', async () => {
    let n = 0;
    const fetchImpl = vi.fn(async () => {
      n += 1;
      return new Response(null, {
        status: 302,
        headers: { location: `https://cdn.example.com/hop-${n}.pdf` },
      });
    });
    const result = await fetchPublicResearchPdf('https://cdn.example.com/paper.pdf', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      skipDnsLookup: true,
      maxRedirects: 2,
    });
    expect(result).toEqual({ ok: false, reason: 'redirect_limit' });
  });

  it('handles timeout', async () => {
    const fetchImpl = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });
    const result = await fetchPublicResearchPdf('https://cdn.example.com/paper.pdf', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      skipDnsLookup: true,
      timeoutMs: 20,
    });
    expect(result).toEqual({ ok: false, reason: 'timeout' });
  });

  it('rejects oversized PDFs', async () => {
    const fetchImpl = vi.fn(async () =>
      pdfResponse(PDF_BYTES, { headers: { 'content-type': 'application/pdf', 'content-length': '999999999' } }),
    );
    const result = await fetchPublicResearchPdf('https://cdn.example.com/paper.pdf', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      skipDnsLookup: true,
      maxBytes: 100,
    });
    expect(result).toEqual({ ok: false, reason: 'too_large' });
  });

  it('rejects HTML pretending to be a PDF', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('<html>not a pdf</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );
    const result = await fetchPublicResearchPdf('https://cdn.example.com/paper.pdf', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      skipDnsLookup: true,
    });
    expect(result).toEqual({ ok: false, reason: 'invalid_content' });
  });

  it('rejects invalid PDF signature with pdf content-type', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('<html>fake</html>', {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    );
    const result = await fetchPublicResearchPdf('https://cdn.example.com/paper.pdf', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      skipDnsLookup: true,
    });
    expect(result).toEqual({ ok: false, reason: 'invalid_content' });
  });

  it('hides upstream errors as fetch failure reasons', async () => {
    const fetchImpl = vi.fn(async () => new Response('boom', { status: 500 }));
    const result = await fetchPublicResearchPdf('https://cdn.example.com/paper.pdf', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      skipDnsLookup: true,
    });
    expect(result).toEqual({ ok: false, reason: 'upstream_error' });
  });
});

function looksLikePdf(bytes: Uint8Array) {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}
