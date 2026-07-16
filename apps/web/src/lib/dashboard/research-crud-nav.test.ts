import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeResearchPaper } from '@/lib/research/research';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T005 research CRUD navigation', () => {
  it('maps publication state for public-link gating', () => {
    const draft = normalizeResearchPaper(
      {
        id: 'r1',
        slug: 'draft-paper',
        title: 'Draft',
        abstract: null,
        is_published: false,
      },
      'alex',
    );
    expect(draft.isPublished).toBe(false);

    const live = normalizeResearchPaper(
      {
        id: 'r2',
        slug: 'live-paper',
        title: 'Live',
        abstract: null,
        is_published: true,
      },
      'alex',
    );
    expect(live.isPublished).toBe(true);
  });

  it('wires Research tab create/edit/public actions without href="#"', () => {
    const page = read('src/app/dashboard/(authenticated)/research/page.tsx');
    const view = read('src/components/dashboard/dashboard-research-view.tsx');

    expect(page).toContain('isProfilePublic');
    expect(page).toContain('basePath="/dashboard"');
    expect(view).toContain('basePath');
    expect(view).toContain('/research/new');
    expect(view).toContain('/edit');
    expect(view).toContain('View public');
    expect(view).toContain('Add research paper');
    expect(view).not.toContain("href: '#'");
    expect(view).not.toContain('href="#"');
    expect(view).not.toContain('href={`#`}');
  });
});
