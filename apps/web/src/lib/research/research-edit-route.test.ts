import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildUpdateResearchFormData,
  createEmptyResearchFormValues,
  researchRecordToFormValues,
} from './research-form';
import type { OwnedResearchRecord } from './research-access-core';

const paper: OwnedResearchRecord = {
  id: '22222222-2222-4222-8222-222222222222',
  tenant_id: 'tenant-1',
  profile_id: 'profile-1',
  owner_user_id: 'user-1',
  related_project_id: null,
  slug: 'attention-is-all-you-need',
  title: 'Attention Is All You Need',
  abstract: 'Transformer architecture',
  authors: ['Ashish Vaswani', 'Noam Shazeer'],
  venue: 'NeurIPS',
  publication_status: 'Published',
  year: 2017,
  pdf_url: 'https://example.com/paper.pdf',
  doi_url: 'https://doi.org/10.5555/3295222.3295349',
  citation_text: 'Vaswani et al., 2017',
  tags: ['ml'],
  cover_image_url: null,
  is_published: false,
  sort_order: 2,
};

describe('researchRecordToFormValues', () => {
  it('maps owned research fields and preserves year as a date-only string', () => {
    const values = researchRecordToFormValues(paper);
    expect(values.title).toBe('Attention Is All You Need');
    expect(values.slug).toBe('attention-is-all-you-need');
    expect(values.authors).toEqual(['Ashish Vaswani', 'Noam Shazeer']);
    expect(values.year).toBe('2017');
    expect(values.abstract).toBe('Transformer architecture');
  });

  it('keeps a blank author slot when authors are empty', () => {
    const values = researchRecordToFormValues({ ...paper, authors: [] });
    expect(values.authors).toEqual(['']);
  });
});

describe('buildUpdateResearchFormData', () => {
  it('includes research_paper_id and omits ownership/publish fields', () => {
    const fd = buildUpdateResearchFormData(paper.id, {
      ...createEmptyResearchFormValues(),
      title: 'Attention Is All You Need',
      slug: 'attention-is-all-you-need',
      authors: ['Ashish Vaswani'],
    });

    expect(fd.get('research_paper_id')).toBe(paper.id);
    expect(fd.get('title')).toBe('Attention Is All You Need');
    expect(fd.get('is_published')).toBeNull();
    expect(fd.get('sort_order')).toBeNull();
    expect(fd.get('owner_user_id')).toBeNull();
    expect(fd.get('related_project_id')).toBeNull();
  });
});

describe('dashboard research edit route', () => {
  it('loads owned papers server-side for the edit page', () => {
    const page = readFileSync(
      resolve(
        process.cwd(),
        'src/app/dashboard/(authenticated)/research/[id]/edit/page.tsx',
      ),
      'utf8',
    );

    expect(page).toContain('loadOwnedResearchPaper');
    expect(page).toContain('ResearchEditForm');
    expect(page).toContain('ResearchDeleteDialog');
    expect(page).toContain('ResearchPublishControls');
    expect(page).toContain('notFound()');
    expect(page).not.toContain('mock');
  });

  it('reuses the shared research form for editing', () => {
    const form = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/research-form.tsx'),
      'utf8',
    );

    expect(form).toContain('updateResearchAction');
    expect(form).toContain('buildUpdateResearchFormData');
    expect(form).toContain("mode === 'edit'");
    expect(form).toContain('Save changes');
    expect(form).not.toContain('Research editing will be available');
    expect(form).not.toContain('type="file"');
    expect(form).not.toContain('related_project');
    expect(form).not.toContain('publishResearchAction');
    expect(form).not.toContain('unpublishResearchAction');
  });

  it('points dashboard edit controls at the edit route', () => {
    const view = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-research-view.tsx'),
      'utf8',
    );

    expect(view).toContain('/dashboard/research/${paper.id}/edit');
    expect(view).toContain('Edit');
  });

  it('uses an accessible delete confirmation dialog', () => {
    const dialog = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/research-delete-dialog.tsx'),
      'utf8',
    );

    expect(dialog).toContain('deleteResearchAction');
    expect(dialog).toContain('role="alertdialog"');
    expect(dialog).toContain('Confirm delete');
    expect(dialog).toContain('Cancel');
    expect(dialog).not.toContain('window.confirm');
  });
});
