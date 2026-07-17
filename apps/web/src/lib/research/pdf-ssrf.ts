import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

/** Maximum PDF body size streamed through the public research PDF route. */
export const PUBLIC_RESEARCH_PDF_MAX_BYTES = 25 * 1024 * 1024;

/** Upstream fetch timeout for research PDF proxying. */
export const PUBLIC_RESEARCH_PDF_TIMEOUT_MS = 12_000;

/** Maximum redirects followed while fetching a research PDF. */
export const PUBLIC_RESEARCH_PDF_MAX_REDIRECTS = 3;

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
]);

function parseIpv4(hostname: string): number[] | null {
  const parts = hostname.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums;
}

function isBlockedIpv4(nums: number[]): boolean {
  const [a, b] = nums;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isBlockedIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // ULA
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true; // link-local
  }
  // IPv4-mapped IPv6 (::ffff:a.b.c.d)
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) {
    const nums = parseIpv4(mapped[1]);
    return nums ? isBlockedIpv4(nums) : true;
  }
  return false;
}

export function isBlockedHostnameOrIp(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }

  const ipVersion = isIP(host.replace(/^\[|\]$/g, ''));
  if (ipVersion === 4) {
    const nums = parseIpv4(host);
    return nums ? isBlockedIpv4(nums) : true;
  }
  if (ipVersion === 6) {
    return isBlockedIpv6(host);
  }

  return false;
}

/**
 * Validate that a candidate PDF URL is an absolute HTTPS URL without credentials
 * and does not target an obviously blocked host/IP literal.
 */
export function assertSafePublicPdfUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('invalid_url');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('non_https');
  }
  if (parsed.username || parsed.password) {
    throw new Error('credentials');
  }
  if (!parsed.hostname) {
    throw new Error('missing_hostname');
  }
  if (isBlockedHostnameOrIp(parsed.hostname)) {
    throw new Error('blocked_host');
  }

  return parsed;
}

/**
 * Resolve hostname and reject private / metadata addresses after DNS lookup.
 */
export async function assertHostnameResolvesPublicly(hostname: string): Promise<void> {
  if (isBlockedHostnameOrIp(hostname)) {
    throw new Error('blocked_host');
  }

  const records = await lookup(hostname, { all: true, verbatim: true });
  if (!records.length) {
    throw new Error('dns_failed');
  }

  for (const record of records) {
    if (isBlockedHostnameOrIp(record.address)) {
      throw new Error('blocked_resolved_ip');
    }
  }
}

export function looksLikePdfBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  // %PDF-
  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

export function isAcceptablePdfContentType(contentType: string | null): boolean {
  if (!contentType) return true; // some hosts omit; signature check still required
  const lowered = contentType.toLowerCase().split(';')[0]?.trim() ?? '';
  if (!lowered) return true;
  if (lowered === 'application/pdf') return true;
  if (lowered === 'application/octet-stream') return true;
  if (lowered === 'binary/octet-stream') return true;
  return false;
}
