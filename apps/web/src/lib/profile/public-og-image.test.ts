import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildGenericPublicOgCard,
  buildPublicProfileOgCard,
  buildPublicProjectOgCard,
  buildPublicResearchOgCard,
  PUBLIC_OG_IMAGE_CONTENT_TYPE,
  PUBLIC_OG_IMAGE_SIZE,
  safeOgLine,
} from './public-og-image';

describe('public OG image helpers', () => {
  it('uses standard social preview dimensions and PNG content type', () => {
    expect(PUBLIC_OG_IMAGE_SIZE).toEqual({ width: 1200, height: 630 });
    expect(PUBLIC_OG_IMAGE_CONTENT_TYPE).toBe('image/png');
  });

  it('builds personalized cards and truncates abusive titles', () => {
    const profile = buildPublicProfileOgCard({
      displayName: '<script>alert(1)</script>'.repeat(10),
      headline: 'javascript:alert(1)',
      handle: 'ada-lovelace',
    });
    expect(profile.title).toContain('<script>');
    expect(profile.title.length).toBeLessThanOrEqual(48);
    expect(profile.subtitle).toBe('javascript:alert(1)');
    expect(profile.handle).toBe('@ada-lovelace');
    expect(profile.title.length).toBeLessThanOrEqual(48);

    expect(
      buildPublicProjectOgCard({
        projectTitle: 'Engine',
        profileDisplayName: 'Ada',
      }).subtitle,
    ).toBe('by Ada');
    expect(
      buildPublicResearchOgCard({
        paperTitle: 'Notes',
        profileDisplayName: 'Ada',
      }).eyebrow,
    ).toBe('CodeCard research');
    expect(buildGenericPublicOgCard().title).toBe('Showcase your work');
    expect(safeOgLine('  Hello\nworld  ', 20)).toBe('Hello world');
  });
});

describe('public OG image route privacy contracts', () => {
  const routes = [
    'src/app/opengraph-image.tsx',
    'src/app/[slug]/opengraph-image.tsx',
    'src/app/[slug]/projects/[id]/opengraph-image.tsx',
    'src/app/[slug]/research/[paperSlug]/opengraph-image.tsx',
  ];

  it('ships root and nested opengraph-image routes', () => {
    for (const route of routes) {
      expect(existsSync(resolve(process.cwd(), route))).toBe(true);
    }
  });

  it('enforces public visibility and falls back without personalized private data', () => {
    const profile = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/opengraph-image.tsx'),
      'utf8',
    );
    const project = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/projects/[id]/opengraph-image.tsx'),
      'utf8',
    );
    const research = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/research/[paperSlug]/opengraph-image.tsx'),
      'utf8',
    );
    const response = readFileSync(
      resolve(process.cwd(), 'src/lib/profile/public-og-image-response.tsx'),
      'utf8',
    );

    expect(profile).toContain("eq('is_public', true)");
    expect(profile).toContain('renderGenericPublicOgImage');
    expect(profile).not.toContain('createServiceClient');

    expect(project).toContain("eq('is_published', true)");
    expect(project).toContain("eq('profile_id', profile.id)");
    expect(project).toContain('renderGenericPublicOgImage');

    expect(research).toContain("eq('is_published', true)");
    expect(research).toContain("eq('slug', paperSlug)");
    expect(research).toContain('renderGenericPublicOgImage');
    expect(research).not.toContain('pdf_url');
    expect(research).not.toContain('storage_path');

    expect(response).toContain('ImageResponse');
    expect(response).not.toContain('dangerouslySetInnerHTML');
    expect(response).toContain('safeOgLine');
  });

  it('metadata points at absolute-relative opengraph-image paths', () => {
    const metadata = readFileSync(
      resolve(process.cwd(), 'src/lib/profile/public-metadata.ts'),
      'utf8',
    );
    expect(metadata).toContain('opengraph-image');
    expect(metadata).toContain('width: PUBLIC_OG_IMAGE_WIDTH');
    expect(metadata).toContain('height: PUBLIC_OG_IMAGE_HEIGHT');
  });
});
