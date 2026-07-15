import { describe, expect, it } from 'vitest';
import {
  validateProjectMediaFile,
  executeProjectMediaUploadFlow,
} from './project-media-upload-client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function makeFile(name: string, type: string, size: number): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe('validateProjectMediaFile', () => {
  it('accepts supported images and rejects SVG', () => {
    expect(validateProjectMediaFile(makeFile('cover.png', 'image/png', 1024)).ok).toBe(true);
    expect(validateProjectMediaFile(makeFile('cover.svg', 'image/svg+xml', 100)).ok).toBe(false);
  });

  it('rejects oversized files', () => {
    const result = validateProjectMediaFile(
      makeFile('cover.png', 'image/png', 5 * 1024 * 1024 + 1),
    );
    expect(result.ok).toBe(false);
  });
});

describe('executeProjectMediaUploadFlow', () => {
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

  it('preserves successful screenshot uploads when another file fails', async () => {
    let finalizeCalls = 0;
    const result = await executeProjectMediaUploadFlow({
      projectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      mediaRole: 'screenshot',
      file: makeFile('one.png', 'image/png', 100),
      optimizeImage: skipOptimize,
      requestInit: async () => ({
        ok: true,
        init: {
          path: 'tenant/user/project-media/project/one.png',
          signedUrl: 'https://example/upload',
          token: 'token',
          mimeType: 'image/png',
          maxBytes: 5 * 1024 * 1024,
        },
      }),
      uploadToStorage: async () => ({ ok: true }),
      finalizeUpload: async () => {
        finalizeCalls += 1;
        return { success: true, assetId: 'asset-1' };
      },
    });

    expect(result.ok).toBe(true);
    expect(finalizeCalls).toBe(1);
  });

  it('fails validation before requesting upload', async () => {
    let requested = false;
    const result = await executeProjectMediaUploadFlow({
      projectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      mediaRole: 'screenshot',
      file: makeFile('bad.svg', 'image/svg+xml', 10),
      optimizeImage: skipOptimize,
      requestInit: async () => {
        requested = true;
        return { ok: false, message: 'nope', failureClass: 'upload_authorization', retryable: true };
      },
      uploadToStorage: async () => ({ ok: true }),
      finalizeUpload: async () => ({ success: true, assetId: 'asset-1' }),
    });

    expect(result.ok).toBe(false);
    expect(requested).toBe(false);
    if (!result.ok) {
      expect(result.retryable).toBe(false);
      expect(result.failureClass).toBe('validation');
    }
  });

  it('optimizes large covers before authorization and preserves aspect metadata', async () => {
    const original = makeFile('cover.jpg', 'image/jpeg', 5000);
    const optimized = makeFile('cover-optimized.jpg', 'image/jpeg', 1200);
    let authorizedSize: number | null = null;

    const result = await executeProjectMediaUploadFlow({
      projectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      mediaRole: 'poster',
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
        mimeType: 'image/jpeg',
      }),
      requestInit: async (input) => {
        authorizedSize = input.file.size;
        return {
          ok: true,
          init: {
            path: 'tenant/user/project-media/project/cover.jpg',
            signedUrl: 'https://example/upload',
            token: 'token',
            mimeType: 'image/jpeg',
            maxBytes: 5 * 1024 * 1024,
          },
        };
      },
      uploadToStorage: async () => ({ ok: true }),
      finalizeUpload: async () => ({ success: true, assetId: 'asset-cover' }),
    });

    expect(result.ok).toBe(true);
    expect(authorizedSize).toBe(1200);
    if (result.ok) {
      expect(result.uploadFileBytes).toBe(1200);
      expect(result.optimizationNote).toContain('Optimized from');
    }
  });

  it('keeps transfer-complete separate from finalizing for screenshot retries', async () => {
    const phases: string[] = [];
    const result = await executeProjectMediaUploadFlow({
      projectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      mediaRole: 'screenshot',
      file: makeFile('one.png', 'image/png', 100),
      optimizeImage: skipOptimize,
      onPhaseChange: (phase) => phases.push(phase),
      onProgress: (progress) => {
        if (progress.percent === 100) {
          expect(phases.includes('finalizing')).toBe(false);
        }
      },
      requestInit: async () => ({
        ok: true,
        init: {
          path: 'tenant/user/project-media/project/one.png',
          signedUrl: 'https://example/upload?token=t',
          token: 'token',
          mimeType: 'image/png',
          maxBytes: 5 * 1024 * 1024,
        },
      }),
      uploadToStorage: async (_init, _file, options) => {
        options?.onProgress?.({ loaded: 100, total: 100, percent: 100 });
        return { ok: true };
      },
      finalizeUpload: async () => ({ success: true, assetId: 'asset-1' }),
    });

    expect(result.ok).toBe(true);
    expect(phases).toEqual(['optimizing', 'authorizing', 'uploading', 'finalizing', 'complete']);
  });

  it('does not use timer-based fake progress in upload clients or UI', () => {
    const client = readFileSync(
      resolve(process.cwd(), 'src/lib/projects/project-media-upload-client.ts'),
      'utf8',
    );
    const transport = readFileSync(
      resolve(process.cwd(), 'src/lib/storage/signed-upload-transport.ts'),
      'utf8',
    );
    const avatarUi = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/avatar-upload.tsx'),
      'utf8',
    );
    const mediaUi = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/project-media-upload.tsx'),
      'utf8',
    );

    for (const source of [client, transport, avatarUi, mediaUi]) {
      expect(source).not.toMatch(/setInterval\s*\([^)]*progress/i);
      expect(source).not.toMatch(/fakeProgress|Math\.random\(\)\s*\*\s*100/);
    }
  });
});
