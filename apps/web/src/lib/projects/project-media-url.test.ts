import { describe, expect, it } from 'vitest';
import {
  createProjectMediaUrlResolver,
  isAbsoluteMediaUrl,
  resolveProjectMediaDisplayUrl,
} from './project-media-url';

describe('project media URL helpers', () => {
  it('detects absolute media URLs', () => {
    expect(isAbsoluteMediaUrl('https://example.com/a.png')).toBe(true);
    expect(isAbsoluteMediaUrl('tenant/user/project-media/id/file.png')).toBe(false);
  });

  it('derives public URLs from canonical storage paths', () => {
    const supabase = {
      storage: {
        from: () => ({
          getPublicUrl: (path: string) => ({
            data: {
              publicUrl: `https://example.supabase.co/storage/v1/object/public/project-media/${path}`,
            },
          }),
        }),
      },
    };

    const url = resolveProjectMediaDisplayUrl(
      supabase as never,
      'tenant/user/project-media/project/file.png',
    );
    expect(url).toContain('/project-media/tenant/user/project-media/project/file.png');

    const resolver = createProjectMediaUrlResolver(supabase as never);
    expect(resolver('tenant/user/project-media/project/file.png')).toBe(url);
  });
});
