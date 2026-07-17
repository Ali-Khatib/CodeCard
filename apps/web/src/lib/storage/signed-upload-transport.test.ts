import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isAllowedSignedUploadUrl,
  uploadFileToSignedUrlWithProgress,
} from './signed-upload-transport';

type FakeXhr = {
  status: number;
  upload: { onprogress: ((event: ProgressEvent) => void) | null };
  onerror: (() => void) | null;
  onabort: (() => void) | null;
  onload: (() => void) | null;
  open: ReturnType<typeof vi.fn>;
  setRequestHeader: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
};

describe('uploadFileToSignedUrlWithProgress', () => {
  const originalXHR = globalThis.XMLHttpRequest;
  let lastXhr: FakeXhr | null = null;

  afterEach(() => {
    globalThis.XMLHttpRequest = originalXHR;
    lastXhr = null;
    vi.restoreAllMocks();
  });

  function installFakeXhr(options?: { autoLoad?: boolean; status?: number }) {
    globalThis.XMLHttpRequest = class FakeXHR {
      status = options?.status ?? 200;
      upload: FakeXhr['upload'] = { onprogress: null };
      onerror: FakeXhr['onerror'] = null;
      onabort: FakeXhr['onabort'] = null;
      onload: FakeXhr['onload'] = null;
      open = vi.fn();
      setRequestHeader = vi.fn();
      abort = vi.fn(() => {
        this.onabort?.();
      });
      send = vi.fn(() => {
        if (options?.autoLoad !== false) {
          queueMicrotask(() => this.onload?.());
        }
      });

      constructor() {
        lastXhr = this as unknown as FakeXhr;
      }
    } as unknown as typeof XMLHttpRequest;
  }

  it('reports real transferred-byte progress and succeeds on 2xx', async () => {
    installFakeXhr({ autoLoad: false });
    const progress: Array<{ loaded: number; total: number; percent: number | null }> = [];

    const promise = uploadFileToSignedUrlWithProgress({
      signedUrl: 'https://storage.example/upload?token=abc',
      file: new File([new Uint8Array(100)], 'avatar.png', { type: 'image/png' }),
      contentType: 'image/png',
      onProgress: (event) => progress.push(event),
    });

    expect(lastXhr).toBeTruthy();
    lastXhr!.upload.onprogress?.({
      lengthComputable: true,
      loaded: 50,
      total: 100,
    } as ProgressEvent);
    lastXhr!.upload.onprogress?.({
      lengthComputable: true,
      loaded: 100,
      total: 100,
    } as ProgressEvent);
    lastXhr!.status = 200;
    lastXhr!.onload?.();

    const result = await promise;
    expect(result.ok).toBe(true);
    expect(progress).toEqual([
      { loaded: 50, total: 100, percent: 50 },
      { loaded: 100, total: 100, percent: 100 },
    ]);
    expect(lastXhr!.open).toHaveBeenCalledWith('PUT', 'https://storage.example/upload?token=abc');
    expect(lastXhr!.setRequestHeader).toHaveBeenCalledWith('x-upsert', 'false');
    expect(lastXhr!.send).toHaveBeenCalledWith(expect.any(FormData));
  });

  it('does not invent progress when totals are unavailable', async () => {
    installFakeXhr({ autoLoad: false });
    const progress: Array<{ percent: number | null }> = [];

    const promise = uploadFileToSignedUrlWithProgress({
      signedUrl: 'https://storage.example/upload?token=abc',
      file: new File([new Uint8Array(10)], 'cover.png', { type: 'image/png' }),
      contentType: 'image/png',
      onProgress: (event) => progress.push({ percent: event.percent }),
    });

    lastXhr!.upload.onprogress?.({
      lengthComputable: false,
      loaded: 4,
      total: 0,
    } as ProgressEvent);
    lastXhr!.status = 200;
    lastXhr!.onload?.();

    await promise;
    expect(progress).toEqual([{ percent: null }]);
  });

  it('aborts cleanly and classifies cancellation', async () => {
    installFakeXhr({ autoLoad: false });
    const controller = new AbortController();

    const promise = uploadFileToSignedUrlWithProgress({
      signedUrl: 'https://storage.example/upload?token=abc',
      file: new File([new Uint8Array(10)], 'shot.png', { type: 'image/png' }),
      contentType: 'image/png',
      signal: controller.signal,
    });

    controller.abort();
    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.cancelled).toBe(true);
      expect(result.failureClass).toBe('cancelled');
    }
  });

  it('rejects non-https signed URLs safely', async () => {
    const result = await uploadFileToSignedUrlWithProgress({
      signedUrl: 'http://insecure.example/upload',
      file: new File([new Uint8Array(1)], 'a.png', { type: 'image/png' }),
      contentType: 'image/png',
    });
    expect(result.ok).toBe(false);
  });

  it('allows only same-origin HTTP loopback URLs for local browser E2E', () => {
    expect(
      isAllowedSignedUploadUrl(
        'http://localhost:3000/e2e-fixtures/signed-upload',
        'http://localhost:3000',
      ),
    ).toBe(true);
    expect(
      isAllowedSignedUploadUrl(
        'http://localhost:3001/e2e-fixtures/signed-upload',
        'http://localhost:3000',
      ),
    ).toBe(false);
    expect(
      isAllowedSignedUploadUrl(
        'http://storage.example/upload',
        'http://localhost:3000',
      ),
    ).toBe(false);
  });

  it('classifies expired authorization responses', async () => {
    installFakeXhr({ autoLoad: false, status: 410 });
    const promise = uploadFileToSignedUrlWithProgress({
      signedUrl: 'https://storage.example/upload?token=abc',
      file: new File([new Uint8Array(1)], 'a.png', { type: 'image/png' }),
      contentType: 'image/png',
    });
    lastXhr!.status = 410;
    lastXhr!.onload?.();
    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failureClass).toBe('signed_upload_expired');
    }
  });
});
