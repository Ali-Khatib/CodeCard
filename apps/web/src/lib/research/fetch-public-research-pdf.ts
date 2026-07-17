import {
  PUBLIC_RESEARCH_PDF_MAX_BYTES,
  PUBLIC_RESEARCH_PDF_MAX_REDIRECTS,
  PUBLIC_RESEARCH_PDF_TIMEOUT_MS,
  assertHostnameResolvesPublicly,
  assertSafePublicPdfUrl,
  isAcceptablePdfContentType,
  looksLikePdfBytes,
} from '@/lib/research/pdf-ssrf';
import { isValidExternalPdfUrl } from '@codecard/validation';

export type PublicResearchPdfFetchResult =
  | {
      ok: true;
      bytes: Uint8Array;
      contentType: 'application/pdf';
      filename: string;
    }
  | {
      ok: false;
      reason:
        | 'invalid_url'
        | 'blocked_host'
        | 'redirect_limit'
        | 'timeout'
        | 'upstream_error'
        | 'too_large'
        | 'invalid_content'
        | 'fetch_failed';
    };

function filenameFromUrl(url: URL): string {
  const last = url.pathname.split('/').filter(Boolean).pop() ?? 'paper.pdf';
  const cleaned = last.replace(/[^\w.\-]+/g, '_').slice(0, 120);
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned || 'paper'}.pdf`;
}

/**
 * Server-only fetch of a trusted external research PDF URL with SSRF hardening.
 * Caller must already resolve the URL from a published research_papers row.
 */
export async function fetchPublicResearchPdf(
  rawUrl: string,
  options?: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    maxBytes?: number;
    maxRedirects?: number;
    /** Test hook: skip DNS resolution (still blocks IP literals / hostnames). */
    skipDnsLookup?: boolean;
  },
): Promise<PublicResearchPdfFetchResult> {
  if (!isValidExternalPdfUrl(rawUrl)) {
    return { ok: false, reason: 'invalid_url' };
  }

  let current: URL;
  try {
    current = assertSafePublicPdfUrl(rawUrl);
  } catch {
    return { ok: false, reason: 'blocked_host' };
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? PUBLIC_RESEARCH_PDF_TIMEOUT_MS;
  const maxBytes = options?.maxBytes ?? PUBLIC_RESEARCH_PDF_MAX_BYTES;
  const maxRedirects = options?.maxRedirects ?? PUBLIC_RESEARCH_PDF_MAX_REDIRECTS;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    try {
      if (!options?.skipDnsLookup) {
        await assertHostnameResolvesPublicly(current.hostname);
      } else if (isBlockedAfterAssert(current)) {
        return { ok: false, reason: 'blocked_host' };
      }
    } catch {
      return { ok: false, reason: 'blocked_host' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(current.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.1',
          'User-Agent': 'CodeCardResearchPdfProxy/1.0',
        },
        cache: 'no-store',
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          return { ok: false, reason: 'upstream_error' };
        }
        if (redirectCount >= maxRedirects) {
          return { ok: false, reason: 'redirect_limit' };
        }
        let next: URL;
        try {
          next = new URL(location, current);
          assertSafePublicPdfUrl(next.toString());
        } catch {
          return { ok: false, reason: 'blocked_host' };
        }
        current = next;
        continue;
      }

      if (!response.ok) {
        return { ok: false, reason: 'upstream_error' };
      }

      const contentType = response.headers.get('content-type');
      if (!isAcceptablePdfContentType(contentType)) {
        return { ok: false, reason: 'invalid_content' };
      }

      const contentLength = Number(response.headers.get('content-length') ?? '');
      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        return { ok: false, reason: 'too_large' };
      }

      const buffer = await readBodyWithLimit(response, maxBytes);
      if (!buffer.ok) {
        return { ok: false, reason: buffer.reason };
      }

      if (!looksLikePdfBytes(buffer.bytes)) {
        return { ok: false, reason: 'invalid_content' };
      }

      return {
        ok: true,
        bytes: buffer.bytes,
        contentType: 'application/pdf',
        filename: filenameFromUrl(current),
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { ok: false, reason: 'timeout' };
      }
      return { ok: false, reason: 'fetch_failed' };
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, reason: 'redirect_limit' };
}

function isBlockedAfterAssert(url: URL): boolean {
  try {
    assertSafePublicPdfUrl(url.toString());
    return false;
  } catch {
    return true;
  }
}

async function readBodyWithLimit(
  response: Response,
  maxBytes: number,
): Promise<
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: 'too_large' | 'fetch_failed' }
> {
  if (!response.body) {
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      return { ok: false, reason: 'too_large' };
    }
    return { ok: true, bytes: new Uint8Array(arrayBuffer) };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // ignore cancel errors
        }
        return { ok: false, reason: 'too_large' };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: 'fetch_failed' };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}
