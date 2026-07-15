/**
 * Browser-only helpers for downloading a profile QR PNG locally.
 * Does not upload to storage or call remote QR services.
 */

export type DownloadProfileQrPngInput = {
  pngDataUrl: string;
  filename: string;
};

export type DownloadProfileQrPngResult =
  | { ok: true; filename: string }
  | { ok: false; error: string };

const PNG_DATA_URL_PREFIX = 'data:image/png;base64,';

/** Validate PNG data URL shape before triggering a download. */
export function assertPngDataUrl(pngDataUrl: string): boolean {
  if (!pngDataUrl.startsWith(PNG_DATA_URL_PREFIX)) return false;
  const base64 = pngDataUrl.slice(PNG_DATA_URL_PREFIX.length).trim();
  if (!base64) return false;
  if (/[\u0000-\u001f]/.test(pngDataUrl.slice(0, 64))) return false;
  return true;
}

/** Decode PNG data URL to bytes (Node/browser compatible). */
export function pngDataUrlToBytes(pngDataUrl: string): Uint8Array | null {
  if (!assertPngDataUrl(pngDataUrl)) return null;
  const base64 = pngDataUrl.slice(PNG_DATA_URL_PREFIX.length);
  try {
    if (typeof globalThis.atob === 'function') {
      const binary = globalThis.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    return Uint8Array.from(Buffer.from(base64, 'base64'));
  } catch {
    return null;
  }
}

/** PNG signature: 89 50 4E 47 0D 0A 1A 0A */
export function hasPngSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

/**
 * Trigger a single browser download for a PNG data URL.
 * Revokes temporary object URLs after the click is scheduled.
 */
export function downloadProfileQrPng(
  input: DownloadProfileQrPngInput,
): DownloadProfileQrPngResult {
  if (typeof document === 'undefined') {
    return { ok: false, error: 'QR download is only available in the browser.' };
  }

  if (!assertPngDataUrl(input.pngDataUrl)) {
    return { ok: false, error: 'QR download did not produce a valid PNG.' };
  }

  const filename = input.filename.trim();
  if (
    !filename ||
    filename.includes('/') ||
    filename.includes('\\') ||
    filename.includes('..') ||
    /[\u0000-\u001f]/.test(filename) ||
    !filename.toLowerCase().endsWith('.png')
  ) {
    return { ok: false, error: 'QR download filename is invalid.' };
  }

  const bytes = pngDataUrlToBytes(input.pngDataUrl);
  if (!bytes || !hasPngSignature(bytes)) {
    return { ok: false, error: 'QR download did not produce a valid PNG file.' };
  }

  let objectUrl: string | null = null;
  try {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy.buffer], { type: 'image/png' });
    objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return { ok: true, filename };
  } catch {
    return { ok: false, error: 'Could not start the QR download in this browser.' };
  } finally {
    if (objectUrl) {
      const toRevoke = objectUrl;
      setTimeout(() => URL.revokeObjectURL(toRevoke), 0);
    }
  }
}
