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
  const skipOptimize = async (file: File) =>
    ({
      ok: true as const,
      file,
      transformed: false,
      originalWidth: 100,
      originalHeight: 100,
      outputWidth: 100,
      outputHeight: 100,
      originalBytes: file.size,
      outputBytes: file.size,
      mimeType: file.type,
      skippedReason: 'within_limits' as const,
    });

  it('runs optimizing before authorizing and uses transformed metadata for authorization', async () => {
    const phases: string[] = [];
    const original = makeFile('avatar.png', 'image/png', 4096);
    const optimized = makeFile('avatar-optimized.png', 'image/png', 1024);
    let authorizedSize: number | null = null;
    let uploadedSize: number | null = null;

    const result = await executeAvatarUploadFlow({
      file: original,
      optimizeImage: async () => ({
        ok: true,
        file: optimized,
        transformed: true,
        originalWidth: 4000,
        originalHeight: 3000,
        outputWidth: 2000,
        outputHeight: 1500,
        originalBytes: original.size,
        outputBytes: optimized.size,
        mimeType: 'image/png',
      }),
      onPhaseChange: (phase) => phases.push(phase),
      requestInit: async (file) => {
        authorizedSize = file.size;
        return { ok: true, init: { ...initResponse, mimeType: file.type } };
      },
      uploadToStorage: async (_init, file) => {
        uploadedSize = file.size;
        return { ok: true };
      },
      finalizeUpload: async () => ({ success: true, avatarUrl: 'https://example.supabase.co/public/avatar.png' }),
    });

    expect(result.ok).toBe(true);
    expect(phases).toEqual(['optimizing', 'authorizing', 'uploading', 'finalizing', 'complete']);
    expect(authorizedSize).toBe(1024);
    expect(uploadedSize).toBe(1024);
    if (result.ok) {
      expect(result.optimizationNote).toContain('Optimized from');
    }
  });

  it('runs authorizing, uploading, finalizing, and complete stages in order', async () => {
    const phases: string[] = [];
    const file = makeFile('avatar.png', 'image/png', 1024);

    const result = await executeAvatarUploadFlow({
      file,
      optimizeImage: skipOptimize,
      onPhaseChange: (phase) => phases.push(phase),
      requestInit: async () => ({ ok: true, init: initResponse }),
      uploadToStorage: async () => ({ ok: true }),
      finalizeUpload: async () => ({ success: true, avatarUrl: 'https://example.supabase.co/public/avatar.png' }),
    });

    expect(result.ok).toBe(true);
    expect(phases).toEqual(['optimizing', 'authorizing', 'uploading', 'finalizing', 'complete']);
  });

  it('keeps 100% transfer separate from finalizing success', async () => {
    const phases: string[] = [];
    let sawUploadProgress = false;

    const result = await executeAvatarUploadFlow({
      file: makeFile('avatar.png', 'image/png', 1024),
      optimizeImage: skipOptimize,
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
    expect(phases).toEqual(['optimizing', 'authorizing', 'uploading', 'finalizing', 'complete']);
  });

  it('does not finalize when storage upload fails and marks retryable network failures', async () => {
    const finalizeUpload = vi.fn();
    const result = await executeAvatarUploadFlow({
      file: makeFile('avatar.png', 'image/png', 1024),
      optimizeImage: skipOptimize,
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
      optimizeImage: skipOptimize,
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
      optimizeImage: skipOptimize,
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
