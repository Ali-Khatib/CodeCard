import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildPublicOgImagePath,
  buildPublicProfileMetadata,
  buildPublicProfilePath,
  buildPublicProjectMetadata,
  buildPublicResearchPageMetadata,
  buildUnavailablePublicMetadata,
  normalizePublicMetadataText,
} from './public-metadata';

describe('normalizePublicMetadataText', () => {
  it('collapses whitespace, strips controls, and truncates', () => {
    expect(normalizePublicMetadataText('  Hello\n\tworld  ')).toBe('Hello world');
    expect(normalizePublicMetadataText('A'.repeat(200))).toHaveLength(160);
    expect(normalizePublicMetadataText('script\u0000alert')).toBe('scriptalert');
  });

  it('keeps HTML-looking text as plain metadata text', () => {
    const text = normalizePublicMetadataText('<script>alert(1)</script> Builder');
    expect(text).toContain('<script>');
    expect(text).toContain('Builder');
  });
});

describe('buildPublicProfileMetadata', () => {
  it('sets title, description, canonical, Open Graph, and Twitter fields', () => {
    const metadata = buildPublicProfileMetadata({
      profileSlug: 'ada-lovelace',
      displayName: 'Ada Lovelace',
      headline: 'Analyst',
      bio: 'Unused when headline present',
    });

    expect(metadata.title).toBe('Ada Lovelace');
    expect(metadata.description).toBe('Analyst');
    expect(metadata.alternates?.canonical).toBe('/ada-lovelace');
    expect(metadata.openGraph).toMatchObject({
      url: '/ada-lovelace',
      type: 'profile',
    });
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
    });
    expect(metadata.openGraph?.images).toEqual([
      {
        url: '/ada-lovelace/opengraph-image',
        width: 1200,
        height: 630,
        type: 'image/png',
      },
    ]);
    expect(buildPublicProfilePath('ada-lovelace')).toBe('/ada-lovelace');
    expect(buildPublicOgImagePath('/ada-lovelace')).toBe('/ada-lovelace/opengraph-image');
  });

  it('falls back from headline to bio to generic CodeCard copy', () => {
    expect(
      buildPublicProfileMetadata({
        profileSlug: 'ada',
        displayName: 'Ada',
        headline: null,
        bio: 'Mathematician',
      }).description,
    ).toBe('Mathematician');
    expect(
      buildPublicProfileMetadata({
        profileSlug: 'ada',
        displayName: 'Ada',
        headline: null,
        bio: null,
      }).description,
    ).toBe('Ada on CodeCard');
  });

  it('does not allow user content to override host or inject private fields', () => {
    const metadata = buildPublicProfileMetadata({
      profileSlug: 'ada',
      displayName: 'https://evil.example',
      headline: 'mailto:secret@example.com',
      bio: null,
    });
    expect(metadata.alternates?.canonical).toBe('/ada');
    expect(JSON.stringify(metadata)).not.toContain('evil.example/opengraph');
    expect(JSON.stringify(metadata)).not.toContain('tenant_id');
    expect(JSON.stringify(metadata)).not.toContain('owner_user_id');
  });
});

describe('buildPublicProjectMetadata', () => {
  it('builds published project metadata with safe description and social image', () => {
    const metadata = buildPublicProjectMetadata({
      profileSlug: 'ada',
      profileDisplayName: 'Ada',
      projectId: 'proj-1',
      projectTitle: 'Engine',
      description: '<b>Plain</b>  description',
    });

    expect(metadata.title).toBe('Engine · Ada');
    expect(metadata.description).toBe('<b>Plain</b> description');
    expect(metadata.alternates?.canonical).toBe('/ada/projects/proj-1');
    expect(metadata.openGraph).toMatchObject({
      images: [
        {
          url: '/ada/projects/proj-1/opengraph-image',
          width: 1200,
          height: 630,
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });
});

describe('buildPublicResearchPageMetadata', () => {
  it('builds published paper metadata without PDF or storage paths', () => {
    const metadata = buildPublicResearchPageMetadata({
      profileSlug: 'ada',
      profileDisplayName: 'Ada',
      paperSlug: 'notes',
      paperTitle: 'Notes',
      abstract: 'A'.repeat(200),
    });

    expect(metadata.title).toBe('Notes · Ada');
    expect(String(metadata.description)).toHaveLength(160);
    expect(metadata.alternates?.canonical).toBe('/ada/research/notes');
    expect(JSON.stringify(metadata)).not.toContain('.pdf');
    expect(JSON.stringify(metadata)).not.toContain('storage');
    expect(metadata.openGraph).toMatchObject({ type: 'article' });
  });
});

describe('buildUnavailablePublicMetadata', () => {
  it('returns generic noindex metadata without content titles', () => {
    for (const kind of ['profile', 'project', 'research'] as const) {
      const metadata = buildUnavailablePublicMetadata(kind);
      expect(metadata.robots).toEqual({ index: false, follow: false });
      expect(String(metadata.title).toLowerCase()).toContain('not found');
      expect(JSON.stringify(metadata)).not.toContain('Secret Draft');
      expect(metadata.openGraph).toBeUndefined();
    }
  });
});

describe('public route metadata contracts', () => {
  it('wires generateMetadata on profile, project, and research public pages', () => {
    const profile = readFileSync(resolve(process.cwd(), 'src/app/[slug]/page.tsx'), 'utf8');
    const project = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/projects/[id]/page.tsx'),
      'utf8',
    );
    const research = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/research/[paperSlug]/page.tsx'),
      'utf8',
    );

    expect(profile).toContain('generateMetadata');
    expect(profile).toContain("eq('is_public', true)");
    expect(project).toContain('generateMetadata');
    expect(project).toContain("eq('is_published', true)");
    expect(project).toContain('buildPublicProjectMetadata');
    expect(research).toContain('buildPublicResearchMetadata');
    expect(research).toContain('buildUnavailablePublicMetadata');
  });
});
