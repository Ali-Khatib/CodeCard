import { describe, expect, it } from 'vitest';
import {
  createResearchSchema,
  externalPdfHostname,
  findForbiddenCreateResearchFields,
  isValidExternalPdfUrl,
  normalizeDoiUrl,
  normalizeExternalPdfUrl,
  normalizeResearchAuthors,
  normalizeResearchSlug,
  reorderResearchSchema,
  RESEARCH_ABSTRACT_MAX_LENGTH,
  RESEARCH_TITLE_MAX_LENGTH,
  updateResearchSchema,
} from './research-schemas';

const PAPER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const validMin = {
  title: 'Attention Is All You Need',
  slug: 'attention-is-all-you-need',
};

describe('createResearchSchema', () => {
  it('accepts a minimal valid paper', () => {
    const parsed = createResearchSchema.safeParse(validMin);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe('Attention Is All You Need');
      expect(parsed.data.slug).toBe('attention-is-all-you-need');
      expect(parsed.data.authors).toEqual([]);
      expect(parsed.data.tags).toEqual([]);
    }
  });

  it('accepts a complete valid paper', () => {
    const parsed = createResearchSchema.safeParse({
      ...validMin,
      abstract: 'A new architecture…',
      authors: ['Ashish Vaswani', 'Noam Shazeer'],
      venue: 'NeurIPS',
      publication_status: 'Published',
      year: 2017,
      doi_url: '10.5555/3295222.3295349',
      pdf_url: 'https://example.com/paper.pdf',
      citation_text: 'Vaswani et al., 2017',
      tags: ['transformers'],
      related_project_id: PROJECT_ID,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.doi_url).toBe('https://doi.org/10.5555/3295222.3295349');
      expect(parsed.data.related_project_id).toBe(PROJECT_ID);
      expect(parsed.data.year).toBe(2017);
    }
  });

  it('rejects empty, whitespace, and overlong titles', () => {
    expect(createResearchSchema.safeParse({ ...validMin, title: '' }).success).toBe(false);
    expect(createResearchSchema.safeParse({ ...validMin, title: '   ' }).success).toBe(false);
    expect(
      createResearchSchema.safeParse({
        ...validMin,
        title: 'x'.repeat(RESEARCH_TITLE_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });

  it('rejects invalid slugs and normalizes valid ones', () => {
    expect(createResearchSchema.safeParse({ ...validMin, slug: '../evil' }).success).toBe(false);
    expect(createResearchSchema.safeParse({ ...validMin, slug: 'ab' }).success).toBe(false);
    const parsed = createResearchSchema.safeParse({
      ...validMin,
      slug: ' Hello World!! ',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.slug).toBe('hello-world');
  });

  it('enforces abstract length and year bounds', () => {
    expect(
      createResearchSchema.safeParse({
        ...validMin,
        abstract: 'a'.repeat(RESEARCH_ABSTRACT_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
    expect(createResearchSchema.safeParse({ ...validMin, year: 1700 }).success).toBe(false);
    expect(createResearchSchema.safeParse({ ...validMin, year: 2017 }).success).toBe(true);
  });

  it('rejects unsafe URL schemes and malformed DOIs', () => {
    expect(
      createResearchSchema.safeParse({
        ...validMin,
        pdf_url: 'javascript:alert(1)',
      }).success,
    ).toBe(false);
    expect(
      createResearchSchema.safeParse({
        ...validMin,
        doi_url: 'not-a-doi',
      }).success,
    ).toBe(false);
  });

  it('accepts HTTPS external PDF URLs and rejects unsafe PDF links', () => {
    expect(
      createResearchSchema.safeParse({
        ...validMin,
        pdf_url: 'https://arxiv.org/pdf/1706.03762.pdf',
      }).success,
    ).toBe(true);
    expect(
      createResearchSchema.safeParse({
        ...validMin,
        pdf_url: 'http://example.com/paper.pdf',
      }).success,
    ).toBe(false);
    expect(
      createResearchSchema.safeParse({
        ...validMin,
        pdf_url: 'https://user:pass@example.com/paper.pdf',
      }).success,
    ).toBe(false);
    expect(
      createResearchSchema.safeParse({
        ...validMin,
        pdf_url: 'data:application/pdf;base64,AAA',
      }).success,
    ).toBe(false);
    expect(
      createResearchSchema.safeParse({
        ...validMin,
        pdf_url: 'file:///tmp/paper.pdf',
      }).success,
    ).toBe(false);
    expect(isValidExternalPdfUrl('//example.com/paper.pdf')).toBe(false);
    expect(normalizeExternalPdfUrl('  https://example.com/a.pdf  ')).toBe(
      'https://example.com/a.pdf',
    );
    expect(externalPdfHostname('https://arxiv.org/pdf/x.pdf')).toBe('arxiv.org');
  });

  it('normalizes authors and rejects overlong author names', () => {
    expect(normalizeResearchAuthors(['  Ada  ', '', 'ada', 'Grace'])).toEqual(['Ada', 'Grace']);
    expect(
      createResearchSchema.safeParse({
        ...validMin,
        authors: ['x'.repeat(200)],
      }).success,
    ).toBe(false);
  });

  it('rejects blank author entries via normalization and invalid related project IDs', () => {
    const parsed = createResearchSchema.safeParse({
      ...validMin,
      authors: ['  ', 'Valid Author'],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.authors).toEqual(['Valid Author']);

    expect(
      createResearchSchema.safeParse({
        ...validMin,
        related_project_id: 'not-a-uuid',
      }).success,
    ).toBe(false);
  });

  it('rejects ownership, publication, ordering, and storage fields', () => {
    for (const field of [
      'owner_user_id',
      'tenant_id',
      'profile_id',
      'is_published',
      'sort_order',
      'bucket',
      'storage_path',
      'cover_image_url',
    ]) {
      expect(
        createResearchSchema.safeParse({
          ...validMin,
          [field]: field === 'is_published' ? true : field === 'sort_order' ? 1 : 'x',
        }).success,
      ).toBe(false);
      expect(
        findForbiddenCreateResearchFields({
          ...validMin,
          [field]: 'x',
        }),
      ).toContain(field);
    }
  });
});

describe('updateResearchSchema', () => {
  it('accepts a valid update and rejects malformed IDs', () => {
    expect(
      updateResearchSchema.safeParse({
        ...validMin,
        research_paper_id: PAPER_ID,
      }).success,
    ).toBe(true);
    expect(
      updateResearchSchema.safeParse({
        ...validMin,
        research_paper_id: 'bad',
      }).success,
    ).toBe(false);
  });

  it('rejects ownership and publication fields on update', () => {
    expect(
      updateResearchSchema.safeParse({
        ...validMin,
        research_paper_id: PAPER_ID,
        is_published: true,
      }).success,
    ).toBe(false);
    expect(
      updateResearchSchema.safeParse({
        ...validMin,
        research_paper_id: PAPER_ID,
        sort_order: 3,
      }).success,
    ).toBe(false);
  });
});

describe('reorderResearchSchema', () => {
  it('accepts a valid unique ID order', () => {
    expect(
      reorderResearchSchema.safeParse({
        research_paper_ids: [PAPER_ID, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'],
      }).success,
    ).toBe(true);
  });

  it('rejects duplicates, malformed IDs, and ownership fields', () => {
    expect(
      reorderResearchSchema.safeParse({
        research_paper_ids: [PAPER_ID, PAPER_ID],
      }).success,
    ).toBe(false);
    expect(
      reorderResearchSchema.safeParse({
        research_paper_ids: ['not-uuid'],
      }).success,
    ).toBe(false);
    expect(
      reorderResearchSchema.safeParse({
        research_paper_ids: [PAPER_ID],
        owner_user_id: PAPER_ID,
      }).success,
    ).toBe(false);
  });
});

describe('research helpers', () => {
  it('normalizes slugs and DOI URLs', () => {
    expect(normalizeResearchSlug(' Hello World!! ')).toBe('hello-world');
    expect(normalizeDoiUrl('10.1000/xyz')).toBe('https://doi.org/10.1000/xyz');
    expect(normalizeDoiUrl('https://doi.org/10.1000/xyz')).toBe('https://doi.org/10.1000/xyz');
  });
});
