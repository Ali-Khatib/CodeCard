import { describe, expect, it, vi } from 'vitest';
import {
  bestEffortRemoveTrustedStorageObject,
  extractAvatarPathFromPublicUrl,
  removeTrustedStorageObject,
} from './storage-cleanup';

describe('extractAvatarPathFromPublicUrl', () => {
  it('extracts canonical paths from public avatar URLs', () => {
    const path =
      '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/avatar/33333333-3333-4333-8333-333333333333/file.png';
    expect(
      extractAvatarPathFromPublicUrl(
        `https://example.supabase.co/storage/v1/object/public/avatars/${path}`,
      ),
    ).toBe(path);
  });

  it('accepts already-canonical paths and rejects traversal', () => {
    const path =
      '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/avatar/33333333-3333-4333-8333-333333333333/file.png';
    expect(extractAvatarPathFromPublicUrl(path)).toBe(path);
    expect(extractAvatarPathFromPublicUrl('../evil.png')).toBeNull();
    expect(extractAvatarPathFromPublicUrl(null)).toBeNull();
  });
});

describe('removeTrustedStorageObject', () => {
  it('rejects URLs and malformed paths before calling storage', async () => {
    const remove = vi.fn();
    const supabase = {
      storage: {
        from: vi.fn(() => ({ remove })),
      },
    };

    const result = await removeTrustedStorageObject(supabase as never, {
      resourceType: 'avatar',
      path: 'https://evil.example/a.png',
    });

    expect(result.ok).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });

  it('removes trusted canonical paths', async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      storage: {
        from: vi.fn(() => ({ remove })),
      },
    };

    const path =
      '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/avatar/33333333-3333-4333-8333-333333333333/file.png';
    const result = await removeTrustedStorageObject(supabase as never, {
      resourceType: 'avatar',
      path,
    });

    expect(result).toEqual({ ok: true, removed: true });
    expect(remove).toHaveBeenCalledWith([path]);
  });

  it('reports remove failures without throwing', async () => {
    const remove = vi.fn().mockResolvedValue({ error: { message: 'nope' } });
    const supabase = {
      storage: {
        from: vi.fn(() => ({ remove })),
      },
    };

    const path =
      '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/project-media/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/file.png';
    const result = await bestEffortRemoveTrustedStorageObject(supabase as never, {
      resourceType: 'project-media',
      path,
    });

    expect(result.cleaned).toBe(false);
  });

  it('treats not-found storage errors as successful cleanup', async () => {
    const remove = vi.fn().mockResolvedValue({
      error: { message: 'Object not found', statusCode: '404' },
    });
    const supabase = {
      storage: {
        from: vi.fn(() => ({ remove })),
      },
    };

    const path =
      '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/project-media/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/file.png';
    const result = await removeTrustedStorageObject(supabase as never, {
      resourceType: 'project-media',
      path,
    });

    expect(result).toEqual({ ok: true, removed: false });
  });
});
