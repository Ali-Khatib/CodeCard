import {
  externalPdfHostname,
  isValidExternalPdfUrl,
  normalizeExternalPdfUrl,
} from '@codecard/validation';

export {
  externalPdfHostname,
  isValidExternalPdfUrl,
  normalizeExternalPdfUrl,
};

/** Safe client/public label for an external paper link host. */
export function describeExternalPdfSource(pdfUrl: string | null | undefined): string | null {
  const host = externalPdfHostname(pdfUrl ?? null);
  if (!host) return null;
  return `Externally hosted · ${host}`;
}

export function sanitizeExternalPdfUrlForPersist(
  raw: string | null | undefined,
): { ok: true; value: string | null } | { ok: false; message: string } {
  const normalized = normalizeExternalPdfUrl(raw);
  if (normalized === undefined || normalized === null) {
    return { ok: true, value: null };
  }
  if (!isValidExternalPdfUrl(normalized)) {
    return {
      ok: false,
      message: 'Enter a valid HTTPS URL without credentials.',
    };
  }
  return { ok: true, value: normalized };
}
