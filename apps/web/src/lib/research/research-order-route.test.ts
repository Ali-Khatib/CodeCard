import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('research ordering wiring', () => {
  it('exposes a reorder action and toolbar on the dashboard', () => {
    const actions = readFileSync(resolve(process.cwd(), 'src/app/actions/research.ts'), 'utf8');
    const view = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-research-view.tsx'),
      'utf8',
    );
    const toolbar = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/research-reorder-toolbar.tsx'),
      'utf8',
    );

    expect(actions).toContain('reorderResearchAction');
    expect(actions).toContain('executeReorderResearch');
    expect(view).toContain('ResearchReorderToolbar');
    expect(view).toContain('orderedPaperIds');
    expect(toolbar).toContain('Move up');
    expect(toolbar).toContain('Move down');
    expect(toolbar).toContain('aria-live');
  });

  it('orders public and preview research with the shared sorter', () => {
    const publicPage = readFileSync(resolve(process.cwd(), 'src/app/[slug]/page.tsx'), 'utf8');
    const preview = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/profile/preview/page.tsx'),
      'utf8',
    );

    expect(publicPage).toContain('sortResearchBySortOrder');
    expect(preview).toContain('sortResearchBySortOrder');
    expect(publicPage).toContain('is_published');
  });
});
