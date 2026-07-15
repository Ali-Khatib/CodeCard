import { describe, expect, it } from 'vitest';
import {
  buildCreateResearchFormData,
  createEmptyResearchFormValues,
  suggestResearchSlugFromTitle,
  validateResearchFormClient,
} from './research-form';

describe('suggestResearchSlugFromTitle', () => {
  it('suggests a slug from the title', () => {
    expect(suggestResearchSlugFromTitle('Graph Neural Nets')).toBe('graph-neural-nets');
  });
});

describe('validateResearchFormClient', () => {
  it('accepts valid minimum values', () => {
    const values = {
      ...createEmptyResearchFormValues(),
      title: 'Graph Neural Nets',
      slug: 'graph-neural-nets',
    };
    expect(validateResearchFormClient(values)).toBeNull();
  });

  it('rejects missing title', () => {
    const values = {
      ...createEmptyResearchFormValues(),
      slug: 'graph-neural-nets',
    };
    expect(validateResearchFormClient(values)).toMatch(/title/i);
  });

  it('rejects invalid DOI', () => {
    const values = {
      ...createEmptyResearchFormValues(),
      title: 'Paper',
      slug: 'paper',
      doi_url: 'not-a-doi',
    };
    expect(validateResearchFormClient(values)).toMatch(/doi/i);
  });

  it('rejects javascript URLs', () => {
    const values = {
      ...createEmptyResearchFormValues(),
      title: 'Paper',
      slug: 'paper',
      pdf_url: 'javascript:alert(1)',
    };
    expect(validateResearchFormClient(values)).toMatch(/url/i);
  });
});

describe('buildCreateResearchFormData', () => {
  it('serializes controlled values without ownership or publish fields', () => {
    const fd = buildCreateResearchFormData({
      ...createEmptyResearchFormValues(),
      title: 'Graph Neural Nets',
      slug: 'graph-neural-nets',
      abstract: 'Summary',
      authors: ['Ada Lovelace', ''],
      venue: 'NeurIPS',
      year: '2017',
      doi_url: '10.1000/xyz123',
      pdf_url: 'https://example.com/paper.pdf',
      citation_text: 'Ada et al.',
      tags: ['ml'],
    });

    expect(fd.get('title')).toBe('Graph Neural Nets');
    expect(fd.get('slug')).toBe('graph-neural-nets');
    expect(fd.get('abstract')).toBe('Summary');
    expect(fd.getAll('authors')).toEqual(['Ada Lovelace']);
    expect(fd.get('venue')).toBe('NeurIPS');
    expect(fd.get('year')).toBe('2017');
    expect(fd.get('doi_url')).toBe('10.1000/xyz123');
    expect(fd.get('pdf_url')).toBe('https://example.com/paper.pdf');
    expect(fd.get('citation_text')).toBe('Ada et al.');
    expect(fd.getAll('tags')).toEqual(['ml']);
    expect(fd.get('is_published')).toBeNull();
    expect(fd.get('sort_order')).toBeNull();
    expect(fd.get('owner_user_id')).toBeNull();
    expect(fd.get('profile_id')).toBeNull();
    expect(fd.get('tenant_id')).toBeNull();
    expect(fd.get('related_project_id')).toBeNull();
  });
});
