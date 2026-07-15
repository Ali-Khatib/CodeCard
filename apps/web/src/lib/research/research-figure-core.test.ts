import { describe, expect, it, vi } from 'vitest';
import {
  assertOwnedResearchFigureStoragePath,
  executeFinalizeResearchFigureUpload,
  executeUpdateResearchFigureCaption,
} from './research-figure-core';
import { researchFigureAltText, resolveResearchFigureDisplayUrl } from './research-figure-url';
import { validateResearchFigureFile } from './research-figure-upload-client';

const TENANT = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';
const PAPER = '33333333-3333-4333-8333-333333333333';
const FIGURE = '44444444-4444-4444-8444-444444444444';
const PATH = `${TENANT}/${OWNER}/research-figure/${PAPER}/55555555-5555-4555-8555-555555555555.png`;

function makeFile(name: string, type: string, size = 1200) {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('research figure validation', () => {
  it('accepts approved raster images and rejects PDF/SVG', () => {
    expect(validateResearchFigureFile(makeFile('a.png', 'image/png')).ok).toBe(true);
    expect(validateResearchFigureFile(makeFile('a.pdf', 'application/pdf')).ok).toBe(false);
    expect(validateResearchFigureFile(makeFile('a.svg', 'image/svg+xml')).ok).toBe(false);
    expect(validateResearchFigureFile(makeFile('a.gif', 'image/gif')).ok).toBe(false);
    expect(validateResearchFigureFile(makeFile('a.png', 'image/jpeg')).ok).toBe(false);
  });
});

describe('assertOwnedResearchFigureStoragePath', () => {
  it('accepts owner paper-scoped research-figure paths only', () => {
    const paper = { id: PAPER, tenant_id: TENANT, owner_user_id: OWNER };
    expect(assertOwnedResearchFigureStoragePath(PATH, paper, OWNER).ok).toBe(true);
    expect(
      assertOwnedResearchFigureStoragePath(
        PATH.replace('research-figure', 'project-media'),
        paper,
        OWNER,
      ).ok,
    ).toBe(false);
    expect(
      assertOwnedResearchFigureStoragePath(
        `https://example.supabase.co/storage/v1/object/public/project-media/${PATH}`,
        paper,
        OWNER,
      ).ok,
    ).toBe(false);
  });
});

describe('resolveResearchFigureDisplayUrl', () => {
  it('prefers storage_path and resolves via public URL helper', () => {
    const supabase = {
      storage: {
        from: () => ({
          getPublicUrl: (path: string) => ({
            data: { publicUrl: `https://cdn.example/${path}` },
          }),
        }),
      },
    };

    expect(
      resolveResearchFigureDisplayUrl(supabase as never, {
        storage_path: PATH,
        image_url: PATH,
      }),
    ).toBe(`https://cdn.example/${PATH}`);

    expect(
      resolveResearchFigureDisplayUrl(supabase as never, {
        storage_path: null,
        image_url: 'https://cdn.example/legacy.png',
      }),
    ).toBe('https://cdn.example/legacy.png');
  });

  it('uses caption for alt text with a safe fallback', () => {
    expect(researchFigureAltText('Model diagram')).toBe('Model diagram');
    expect(researchFigureAltText('')).toBe('Research figure');
    expect(researchFigureAltText(null)).toBe('Research figure');
  });
});

describe('executeFinalizeResearchFigureUpload', () => {
  it('rejects unauthenticated callers', async () => {
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null } })),
      },
    };

    const result = await executeFinalizeResearchFigureUpload(supabase as never, {
      research_paper_id: PAPER,
      path: PATH,
    });
    expect(result.success).toBeUndefined();
    expect(result.error).toBeTruthy();
  });
});

describe('executeUpdateResearchFigureCaption', () => {
  it('rejects overlong captions via schema', async () => {
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: OWNER } },
        })),
      },
    };

    const result = await executeUpdateResearchFigureCaption(supabase as never, {
      research_paper_id: PAPER,
      figure_id: FIGURE,
      caption: 'x'.repeat(600),
    });
    expect(result.success).toBeUndefined();
    expect(result.error).toMatch(/Caption/i);
  });
});
