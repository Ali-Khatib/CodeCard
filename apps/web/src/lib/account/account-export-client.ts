import { buildAccountExportFilename } from '@/lib/account/export-schema';

export type AccountExportClientResult =
  | { ok: true; filename: string }
  | { ok: false; message: string; status?: number };

const FALLBACK_ERROR = 'We couldn’t prepare your export right now. Your account was not changed.';

export function messageForAccountExportFailure(status: number, bodyError?: string): string {
  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 429) {
    return 'Too many export requests. Please try again later.';
  }
  if (status === 413) {
    return 'Your export is too large to download right now. Your account was not changed.';
  }
  if (status === 503) {
    return 'Export is temporarily unavailable. Your account was not changed.';
  }
  if (bodyError && bodyError.length <= 160 && !/postgres|supabase|service.?role|sql/i.test(bodyError)) {
    return bodyError;
  }
  return FALLBACK_ERROR;
}

/** Parse a simple attachment filename from Content-Disposition. */
export function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const utfMatch = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) {
    try {
      const decoded = decodeURIComponent(utfMatch[1].trim().replace(/^"|"$/g, ''));
      if (decoded && !decoded.includes('..') && decoded.toLowerCase().endsWith('.json')) {
        return decoded;
      }
    } catch {
      // fall through
    }
  }
  const plainMatch = /filename\s*=\s*"([^"]+)"/i.exec(header) ?? /filename\s*=\s*([^;]+)/i.exec(header);
  if (!plainMatch?.[1]) return null;
  const name = plainMatch[1].trim().replace(/^"|"$/g, '');
  if (!name || name.includes('..') || /[\u0000-\u001f]/.test(name)) return null;
  if (!name.toLowerCase().endsWith('.json')) return null;
  return name;
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}

/**
 * Request the authenticated account export and start a browser download.
 * Uses the session cookie; never accepts a client-selected user id.
 */
export async function downloadAccountExport(options?: {
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<AccountExportClientResult> {
  const fetchImpl = options?.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetchImpl('/api/account/export', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ format: 'json' }),
    });
  } catch {
    return {
      ok: false,
      message: 'The export was interrupted. Please try again. Your account was not changed.',
    };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return {
      ok: false,
      status: response.status,
      message: messageForAccountExportFailure(response.status, body?.error),
    };
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return { ok: false, message: FALLBACK_ERROR };
  }

  let blob: Blob;
  try {
    blob = await response.blob();
  } catch {
    return { ok: false, message: FALLBACK_ERROR };
  }

  if (blob.size === 0) {
    return { ok: false, message: FALLBACK_ERROR };
  }

  const filename =
    filenameFromContentDisposition(response.headers.get('content-disposition')) ??
    buildAccountExportFilename(options?.now);

  try {
    triggerBrowserDownload(blob, filename);
  } catch {
    return { ok: false, message: 'Could not start the download in this browser.' };
  }

  return { ok: true, filename };
}
