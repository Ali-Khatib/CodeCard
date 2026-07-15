import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('research publishing lifecycle wiring', () => {
  it('exposes dedicated publish and unpublish actions', () => {
    const actions = readFileSync(
      resolve(process.cwd(), 'src/app/actions/research.ts'),
      'utf8',
    );

    expect(actions).toContain('publishResearchAction');
    expect(actions).toContain('unpublishResearchAction');
    expect(actions).toContain('executePublishResearch');
    expect(actions).toContain('executeUnpublishResearch');
    expect(actions).toContain('touchPublicRoutes: true');
  });

  it('keeps publication out of create and update allowlists', () => {
    const create = readFileSync(
      resolve(process.cwd(), 'src/lib/research/research-create-core.ts'),
      'utf8',
    );
    const update = readFileSync(
      resolve(process.cwd(), 'src/lib/research/research-update-core.ts'),
      'utf8',
    );

    expect(create).toContain('is_published: false');
    expect(update).not.toContain('is_published: data');
    expect(update).not.toContain('is_published: true');
    expect(update).not.toContain('is_published: false');
    expect(update).toContain('isPublished: paper.is_published');
  });

  it('renders publish controls on the edit route only', () => {
    const editPage = readFileSync(
      resolve(
        process.cwd(),
        'src/app/dashboard/(authenticated)/research/[id]/edit/page.tsx',
      ),
      'utf8',
    );
    const newPage = readFileSync(
      resolve(
        process.cwd(),
        'src/app/dashboard/(authenticated)/research/new/page.tsx',
      ),
      'utf8',
    );
    const controls = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/research-publish-controls.tsx'),
      'utf8',
    );

    expect(editPage).toContain('ResearchPublishControls');
    expect(newPage).not.toContain('ResearchPublishControls');
    expect(controls).toContain('publishResearchAction');
    expect(controls).toContain('unpublishResearchAction');
    expect(controls).toContain('View public page');
    expect(controls).toContain('Confirm unpublish');
  });
});
