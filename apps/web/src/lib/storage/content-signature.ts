/**
 * Bounded magic-byte checks for live image upload categories (WS11-T010).
 * Does not claim antivirus / malware scanning.
 */

export type DetectedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

const JPEG = [0xff, 0xd8, 0xff] as const;
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46] as const; // RIFF
const WEBP_WEBP = [0x57, 0x45, 0x42, 0x50] as const; // WEBP at offset 8

function startsWith(bytes: Uint8Array, sig: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false;
  return sig.every((b, i) => bytes[offset + i] === b);
}

/** Inspect at most the first 16 bytes. */
export function detectImageMimeFromMagicBytes(bytes: Uint8Array): DetectedImageMime | null {
  if (startsWith(bytes, JPEG)) return 'image/jpeg';
  if (startsWith(bytes, PNG)) return 'image/png';
  if (startsWith(bytes, WEBP_RIFF) && startsWith(bytes, WEBP_WEBP, 8)) return 'image/webp';
  return null;
}

export function mimeMatchesDetected(
  declaredMime: string,
  detected: DetectedImageMime | null,
): boolean {
  if (!detected) return false;
  const normalized = declaredMime.toLowerCase().trim();
  if (normalized === 'image/jpg') return detected === 'image/jpeg';
  return normalized === detected;
}

/** Reject common active/polyglot prefixes that must never finalize as images. */
export function looksLikeActiveOrNonImageContent(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return true;
  // HTML / SVG / XML / script
  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.slice(0, Math.min(bytes.length, 64)))
    .trimStart()
    .toLowerCase();
  if (head.startsWith('<!doctype') || head.startsWith('<html') || head.startsWith('<svg')) {
    return true;
  }
  if (head.startsWith('<?xml') && head.includes('svg')) return true;
  if (head.startsWith('%pdf-')) return true; // PDF must not finalize as image
  return false;
}

/** Bounded PDF signature check for future hosted PDFs / proxy verification. */
export function looksLikePdfMagic(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.slice(0, 5))
    .toUpperCase();
  return head === '%PDF-';
}
