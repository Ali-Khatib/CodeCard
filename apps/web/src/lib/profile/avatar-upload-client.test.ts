import { describe, expect, it, vi } from 'vitest';
import { FILE_LIMITS } from '@codecard/config';
import {
  AVATAR_UPLOAD_BUCKET,
  executeAvatarUploadFlow,
  mapAvatarValidationMessage,
  requestAvatarUploadInit,
  uploadAvatarToSignedUrl,
  validateAvatarFile,
} from './avatar-upload-client';

function makeFile(name: string, type: string, size: number): File {
  const buffer = new Uint8Array(size);
  return new File([buffer], name, { type });
}

const initResponse = {
  path: 'tenant/user/avatar/profile/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png',
  signedUrl: 'https://storage.example/upload',
  token: 'upload-token',
  mimeType: 'image/png',
  maxBytes: FILE_LIMITS.image.maxBytes,
};

describe('validateAvatarFile', () => {
  it('accepts JPEG, PNG, and WebP files', () => {
    expect(validateAvatarFile(makeFile('avatar.jpg', 'image/jpeg', 1024)).ok).toBe(true);
    expect(validateAvatarFile(makeFile('avatar.png', 'image/png', 1024)).ok).toBe(true);
    expect(validateAvatarFile(makeFile('avatar.webp', 'image/webp', 1024)).ok).toBe(true);
  });

  it('rejects SVG, PDF, unsupported MIME, zero-byte, oversized, mismatch, and unsafe filenames', () => {
    expect(validateAvatarFile(makeFile('avatar.svg', 'image/svg+xml', 1024)).ok).toBe(false);
    expect(validateAvatarFile(makeFile('avatar.pdf', 'application/pdf', 1024)).ok).toBe(false);
    expect(validateAvatarFile(makeFile('avatar.gif', 'image/gif', 1024)).ok).toBe(false);
    expect(validateAvatarFile(makeFile('avatar.png', 'image/png', 0)).ok).toBe(false);
    expect(
      validateAvatarFile(makeFile('avatar.png', 'image/png', FILE_LIMITS.image.maxBytes + 1)).ok,
    ).toBe(false);
    expect(validateAvatarFile(makeFile('avatar.png', 'image/jpeg', 1024)).ok).toBe(false);
    expect(validateAvatarFile(makeFile('../avatar.png', 'image/png', 1024)).ok).toBe(false);
    expect(validateAvatarFile(makeFile('avatar.pdf.exe', 'image/png', 1024)).ok).toBe(false);
  });

  it('maps validation errors to user-facing messages', () => {
    const oversized = validateAvatarFile(makeFile('avatar.png', 'image/png', FILE_LIMITS.image.maxBytes + 1));
    expect(oversized.ok).toBe(false);
    if (!oversized.ok) {
      expect(mapAvatarValidationMessage(oversized)).toBe('Image must be 5 MB or smaller.');
    }

    const unsupported = validateAvatarFile(makeFile('avatar.svg', 'image/svg+xml', 1024));
    expect(unsupported.ok).toBe(false);
    if (!unsupported.ok) {
      expect(mapAvatarValidationMessage(unsupported)).toBe('Use a JPEG, PNG, or WebP image.');
    }
  });
});

describe('requestAvatarUploadInit', () => {
  it('does not call the upload API for invalid files', async () => {
    const fetchImpl = vi.fn();
    const result = await requestAvatarUploadInit(
      makeFile('avatar.svg', 'image/svg+xml', 1024),
      fetchImpl,
    );
    expect(result.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('requests avatar upload initialization for valid files', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => initResponse,
    });

    const result = await requestAvatarUploadInit(makeFile('avatar.png', 'image/png', 1024), fetchImpl);
    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith('/api/upload', expect.objectContaining({ method: 'POST' }));
    const body = JSON.parse(String(fetchImpl.mock.calls[0][1].body));
    expect(body.resourceType).toBe('avatar');
    expect(body.filename).toBe('avatar.png');
  });
});

describe('uploadAvatarToSignedUrl', () => {
  it('uses signed-url transport with progress instead of inventing percentages', async () => {
    const progress: number[] = [];
    const originalXHR = globalThis.XMLHttpRequest;

    globalThis.XMLHttpRequest = class FakeXHR {
      status = 200;
      upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      open = vi.fn();
      setRequestHeader = vi.fn();
      abort = vi.fn();
      send = vi.fn(() => {
        this.upload.onprogress?.({
          lengthComputable: true,
          loaded: 1024,
          total: 1024,
        } as ProgressEvent);
        queueMicrotask(() => this.onload?.());
      });
    } as unknown as typeof XMLHttpRequest;

    try {
      const file = makeFile('avatar.png', 'image/png', 1024);
      const result = await uploadAvatarToSignedUrl(null, initResponse, file, {
        onProgress: (event) => {
          if (typeof event.percent === 'number') progress.push(event.percent);
        },
      });
      expect(result.ok).toBe(true);
      expect(progress).toEqual([100]);
      expect(AVATAR_UPLOAD_BUCKET).toBeTruthy();
    } finally {
      globalThis.XMLHttpRequest = originalXHR;
    }
  });
});

describe('executeAvatarUploadFlow', () => {
  it('runs authorizing, uploading, finalizing, and complete stages in order', async () => {
    const phases: string[] = [];
    const file = makeFile('avatar.png', 'image/png', 1024);

    const result = await executeAvatarUploadFlow({
      file,
      onPhaseChange: (phase) => phases.push(phase),
      requestInit: async () => ({ ok: true, init: initResponse }),
      uploadToStorage: async () => ({ ok: true }),
      finalizeUpload: async () => ({ success: true, avatarUrl: 'https://example.supabase.co/public/avatar.png' }),
    });

    expect(result.ok).toBe(true);
    expect(phases).toEqual(['authorizing', 'uploading', 'finalizing', 'complete']);
  });

  it('keeps 100% transfer separate from finalizing success', async () => {
    const phases: string[] = [];
    let sawUploadProgress = false;

    const result = await executeAvatarUploadFlow({
      file: makeFile('avatar.png', 'image/png', 1024),
      onPhaseChange: (phase) => phases.push(phase),
      onProgress: (progress) => {
        if (progress.percent === 100) {
          sawUploadProgress = true;
          expect(phases.includes('finalizing')).toBe(false);
        }
      },
      requestInit: async () => ({ ok: true, init: initResponse }),
      uploadToStorage: async (_init, _file, options) => {
        options?.onProgress?.({ loaded: 1024, total: 1024, percent: 100 });
        return { ok: true };
      },
      finalizeUpload: async () => ({ success: true, avatarUrl: 'https://example.supabase.co/public/avatar.png' }),
    });

    expect(result.ok).toBe(true);
    expect(sawUploadProgress).toBe(true);
    expect(phases).toEqual(['authorizing', 'uploading', 'finalizing', 'complete']);
  });

  it('does not finalize when storage upload fails and marks retryable network failures', async () => {
    const finalizeUpload = vi.fn();
    const result = await executeAvatarUploadFlow({
      file: makeFile('avatar.png', 'image/png', 1024),
      requestInit: async () => ({ ok: true, init: initResponse }),
      uploadToStorage: async () => ({
        ok: false,
        message: 'The upload was interrupted. Try again.',
        failureClass: 'network',
      }),
      finalizeUpload,
    });

    expect(result.ok).toBe(false);
    expect(finalizeUpload).not.toHaveBeenCalled();
    if (!result.ok) {
      expect(result.retryable).toBe(true);
      expect(result.failureClass).toBe('network');
    }
  });

  it('does not report success when finalization fails', async () => {
    const result = await executeAvatarUploadFlow({
      file: makeFile('avatar.png', 'image/png', 1024),
      requestInit: async () => ({ ok: true, init: initResponse }),
      uploadToStorage: async () => ({ ok: true }),
      finalizeUpload: async () => ({ success: false, error: 'Could not save your avatar. Please try again.' }),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('finalizing');
      expect(result.retryable).toBe(true);
    }
  });

  it('marks validation failures as non-retryable', async () => {
    const result = await executeAvatarUploadFlow({
      file: makeFile('avatar.svg', 'image/svg+xml', 100),
      requestInit: async () => ({ ok: true, init: initResponse }),
      uploadToStorage: async () => ({ ok: true }),
      finalizeUpload: async () => ({ success: true, avatarUrl: 'https://example/x.png' }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failureClass).toBe('validation');
      expect(result.retryable).toBe(false);
    }
  });
});
