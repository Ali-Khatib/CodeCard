import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeResearchPaper } from './research';
import {
  formatRelatedProjectOptionLabel,
  type ResearchRelatedProjectOption,
} from './research-form';

describe('normalizeResearchPaper related project privacy', () => {
  it('exposes related project only when the project is published', () => {
    const published = normalizeResearchPaper(
      {
        id: 'paper-1',
        slug: 'paper',
        title: 'Paper',
        abstract: null,
        related_project_id: 'proj-1',
        related_project: { id: 'proj-1', title: 'DevFlow', is_published: true },
      },
      'alex',
    );
    expect(published.relatedProjectHref).toBe('/alex/projects/proj-1');
    expect(published.relatedProjectTitle).toBe('DevFlow');

    const draft = normalizeResearchPaper(
      {
        id: 'paper-1',
        slug: 'paper',
        title: 'Paper',
        abstract: null,
        related_project_id: 'proj-1',
        related_project: { id: 'proj-1', title: 'Secret', is_published: false },
      },
      'alex',
    );
    expect(draft.relatedProjectHref).toBeNull();
    expect(draft.relatedProjectTitle).toBeNull();
    expect(draft.relatedProjectId).toBeNull();
  });
});

describe('formatRelatedProjectOptionLabel', () => {
  it('disambiguates duplicate titles with slug', () => {
    const options: ResearchRelatedProjectOption[] = [
      { id: '1', title: 'DevFlow', slug: 'dev-flow' },
      { id: '2', title: 'DevFlow', slug: 'dev-flow-2' },
    ];
    expect(formatRelatedProjectOptionLabel(options[0]!, options)).toBe('DevFlow (dev-flow)');
  });
});

describe('related project editor wiring', () => {
  it('loads owned projects on create and edit routes', () => {
    const createPage = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/research/new/page.tsx'),
      'utf8',
    );
    const editPage = readFileSync(
      resolve(
        process.cwd(),
        'src/app/dashboard/(authenticated)/research/[id]/edit/page.tsx',
      ),
      'utf8',
    );
    expect(createPage).toContain('loadOwnedProjectsForResearchPicker');
    expect(editPage).toContain('loadOwnedProjectsForResearchPicker');
  });

  it('queries related project publication state for public surfaces', () => {
    const publicHelper = readFileSync(
      resolve(process.cwd(), 'src/lib/research/research-public.ts'),
      'utf8',
    );
    expect(publicHelper).toContain('related_project:related_project_id(id, title, is_published)');
  });
});
