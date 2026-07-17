import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  downloadAccountExport,
  filenameFromContentDisposition,
  messageForAccountExportFailure,
} from './account-export-client';

describe('account export client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses Content-Disposition filenames safely', () => {
    expect(
      filenameFromContentDisposition(
        'attachment; filename="codecard-account-export-2026-07-17.json"',
      ),
    ).toBe('codecard-account-export-2026-07-17.json');
    expect(filenameFromContentDisposition('attachment; filename="evil.exe"')).toBeNull();
    expect(filenameFromContentDisposition('attachment; filename="../x.json"')).toBeNull();
    expect(filenameFromContentDisposition(null)).toBeNull();
  });

  it('maps export HTTP failures to safe messages', () => {
    expect(messageForAccountExportFailure(401)).toMatch(/session/i);
    expect(messageForAccountExportFailure(429)).toMatch(/too many/i);
    expect(messageForAccountExportFailure(500)).toMatch(/not changed/i);
  });

  it('downloads a successful JSON export and revokes the object URL', async () => {
    const blob = new Blob([JSON.stringify({ schema_version: '1.0' })], {
      type: 'application/json',
    });
    const fetchImpl = vi.fn(async () =>
      new Response(blob, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="codecard-account-export-2026-07-17.json"',
        },
      }),
    );

    const createObjectURL = vi.fn(() => 'blob:mock-export');
    const revokeObjectURL = vi.fn();
    const click = vi.fn();
    const removeChild = vi.fn();
    const appendChild = vi.fn((node: { click?: () => void }) => {
      node.click = click;
      return node;
    });
    const createElement = vi.fn(() => ({
      href: '',
      download: '',
      rel: '',
      style: { display: '' },
      click,
    }));

    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.stubGlobal('document', {
      createElement,
      body: { appendChild, removeChild },
    });

    const result = await downloadAccountExport({ fetchImpl: fetchImpl as never });
    expect(result).toEqual({
      ok: true,
      filename: 'codecard-account-export-2026-07-17.json',
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/account/export',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ format: 'json' }),
      }),
    );
    expect(click).toHaveBeenCalledTimes(1);
    await new Promise((r) => setTimeout(r, 0));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-export');
  });

  it('does not claim success on unauthorized or malformed responses', async () => {
    const unauthorized = await downloadAccountExport({
      fetchImpl: vi.fn(async () =>
        new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
      ) as never,
    });
    expect(unauthorized.ok).toBe(false);
    if (!unauthorized.ok) expect(unauthorized.message).toMatch(/session/i);

    const wrongType = await downloadAccountExport({
      fetchImpl: vi.fn(async () =>
        new Response('not-json', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        }),
      ) as never,
    });
    expect(wrongType.ok).toBe(false);

    const network = await downloadAccountExport({
      fetchImpl: vi.fn(async () => {
        throw new Error('offline');
      }) as never,
    });
    expect(network.ok).toBe(false);
    if (!network.ok) expect(network.message).toMatch(/interrupted|not changed/i);
  });

  it('never sends a client-selected user id', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 500 }));
    await downloadAccountExport({ fetchImpl: fetchImpl as never });
    const call = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(call[1].body)).not.toMatch(/userId|user_id|owner/i);
  });
});
