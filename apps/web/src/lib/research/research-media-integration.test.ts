import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('WS05-T011 research media integration', () => {
  it('wires the research media section into the edit route', () => {
    const page = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/research/[id]/edit/page.tsx'),
      'utf8',
    );
    const media = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/research-media-section.tsx'),
      'utf8',
    );

    expect(page).toContain('ResearchMediaSection');
    expect(media).toContain('CodeCard-hosted PDF uploads are unavailable');
    expect(media).toContain('ResearchFigureManager');
    expect(media).toContain('Open external paper');
    expect(media).not.toContain('private-doc');
    expect(media).not.toContain('dangerouslySetInnerHTML');
  });

  it('guides new-research route to create first then add media on edit', () => {
    const page = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/research/new/page.tsx'),
      'utf8',
    );
    expect(page).toContain('Create the paper first, then add its PDF and figures');
    expect(page).not.toContain('ResearchFigureManager');
    expect(page).not.toContain('ResearchMediaSection');
  });

  it('redirects successful create to the edit route for media', () => {
    const core = readFileSync(
      resolve(process.cwd(), 'src/lib/research/research-create-core.ts'),
      'utf8',
    );
    expect(core).toContain('`/dashboard/research/${paper.id}/edit`');
  });

  it('cleans up trusted figure objects on paper delete without touching external PDFs', () => {
    const del = readFileSync(
      resolve(process.cwd(), 'src/lib/research/research-delete-core.ts'),
      'utf8',
    );
    expect(del).toContain('collectResearchStorageCleanupTargets');
    expect(del).toContain('enqueueStorageCleanupJob');
    expect(del).toContain('external PDF URLs are never deleted remotely');
    expect(del).not.toContain("from('storage')");

    const collect = readFileSync(
      resolve(process.cwd(), 'src/lib/jobs/collect-research-cleanup-targets.ts'),
      'utf8',
    );
    expect(collect).toContain('listTrustedResearchFigureStoragePaths');
    expect(collect).toContain("'research-figure'");
  });

  it('keeps public PDF action in-app with external original fallback', () => {
    const detail = readFileSync(
      resolve(process.cwd(), 'src/components/research/research-paper-detail.tsx'),
      'utf8',
    );
    expect(detail).toContain('ResearchPdfReadButton');
    expect(detail).toContain('CodeCard does not host or verify this file');
    expect(detail).toContain("figure.caption?.trim() ? '' : 'Research figure'");
    expect(detail).not.toContain('Download paper');
    expect(detail).not.toContain('storage_path');
    expect(detail).not.toContain('iframe');
  });
});
