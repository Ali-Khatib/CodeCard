import { describe, expect, it } from 'vitest';
import {
  validateProjectMediaFile,
  executeProjectMediaUploadFlow,
} from './project-media-upload-client';

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
  it('preserves successful screenshot uploads when another file fails', async () => {
    let finalizeCalls = 0;
    const result = await executeProjectMediaUploadFlow({
      projectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      mediaRole: 'screenshot',
      file: makeFile('one.png', 'image/png', 100),
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
      requestInit: async () => {
        requested = true;
        return { ok: false, message: 'nope' };
      },
      uploadToStorage: async () => ({ ok: true }),
      finalizeUpload: async () => ({ success: true, assetId: 'asset-1' }),
    });

    expect(result.ok).toBe(false);
    expect(requested).toBe(false);
  });
});
