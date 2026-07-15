import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildPublicResearchMetadata,
  buildPublicResearchPath,
  FORBIDDEN_PUBLIC_RESEARCH_KEYS,
  PUBLIC_RESEARCH_PAPER_SELECT,
  truncatePlainText,
  toPublicResearchPaper,
} from './research-public';

describe('public research metadata', () => {
  it('builds a safe title, truncated plain-text description, and canonical path', () => {
    const metadata = buildPublicResearchMetadata({
      profileDisplayName: 'Ada Lovelace',
      paperTitle: 'Analytical Engine Notes',
      abstract: 'A'.repeat(200),
      profileSlug: 'ada',
      paperSlug: 'analytical-engine-notes',
    });

    expect(metadata.title).toBe('Analytical Engine Notes · Ada Lovelace');
    expect(String(metadata.description)).toHaveLength(160);
    expect(metadata.alternates?.canonical).toBe('/ada/research/analytical-engine-notes');
    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      images: [
        {
          url: '/ada/research/analytical-engine-notes/opengraph-image',
          width: 1200,
          height: 630,
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
    expect(buildPublicResearchPath('ada', 'analytical-engine-notes')).toBe(
      '/ada/research/analytical-engine-notes',
    );
  });

  it('falls back when abstract is missing', () => {
    const metadata = buildPublicResearchMetadata({
      profileDisplayName: 'Ada Lovelace',
      paperTitle: 'Notes',
      abstract: null,
      profileSlug: 'ada',
      paperSlug: 'notes',
    });
    expect(metadata.description).toContain('Ada Lovelace');
  });
});

describe('public research field mapping', () => {
  it('maps only public fields and hides draft related projects', () => {
    const paper = toPublicResearchPaper(
      {
        id: 'paper-1',
        slug: 'notes',
        title: 'Notes',
        abstract: 'Plain <b>text</b>',
        authors: ['Ada'],
        related_project_id: 'proj-1',
        related_project: { id: 'proj-1', title: 'Secret', is_published: false },
        research_figures: [],
      },
      'ada',
    );

    expect(paper.title).toBe('Notes');
    expect(paper.abstract).toBe('Plain <b>text</b>');
    expect(paper.relatedProjectHref).toBeNull();
    for (const key of FORBIDDEN_PUBLIC_RESEARCH_KEYS) {
      expect(paper).not.toHaveProperty(key);
    }
  });

  it('does not silently truncate meaningful short abstracts', () => {
    expect(truncatePlainText('Short abstract.', 160)).toBe('Short abstract.');
  });
});

describe('public research route privacy contract', () => {
  it('requires public profile, published paper, profile-scoped slug lookup, and explicit select', () => {
    const page = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/research/[paperSlug]/page.tsx'),
      'utf8',
    );

    expect(page).toContain("eq('is_public', true)");
    expect(page).toContain("eq('is_published', true)");
    expect(page).toContain("eq('profile_id', profile.id)");
    expect(page).toContain("eq('slug', paperSlug)");
    expect(page).toContain('generateMetadata');
    expect(page).toContain('PUBLIC_RESEARCH_PAPER_SELECT');
    expect(page).toContain('toPublicResearchPaper');
    expect(page).toContain('notFound()');
    expect(page).not.toContain("from('research_papers').select('*')");
    expect(PUBLIC_RESEARCH_PAPER_SELECT).not.toContain('tenant_id');
    expect(PUBLIC_RESEARCH_PAPER_SELECT).not.toContain('owner_user_id');
  });

  it('keeps external research links safer with noopener', () => {
    const detail = readFileSync(
      resolve(process.cwd(), 'src/components/research/research-paper-detail.tsx'),
      'utf8',
    );
    expect(detail).toContain('rel="noopener noreferrer"');
    expect(detail).not.toContain('dangerouslySetInnerHTML');
  });
});
