import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeFeaturedProject } from './featured';

describe('normalizeFeaturedProject media integration', () => {
  it('resolves poster and screenshot storage paths in deterministic order', () => {
    const project = normalizeFeaturedProject(
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        title: 'Demo',
        tagline: null,
        description: null,
        technologies: [],
        project_media_assets: [
          { type: 'screenshot', storage_path: 'path/screen-2.png', sort_order: 2 },
          { type: 'poster', storage_path: 'path/cover.png', sort_order: 0 },
          { type: 'screenshot', storage_path: 'path/screen-1.png', sort_order: 1 },
        ],
      },
      {
        resolveStoragePath: (path) => `https://cdn.example/${path}`,
      },
    );

    expect(project.posterUrl).toBe('https://cdn.example/path/cover.png');
    expect(project.screenshots).toEqual([
      'https://cdn.example/path/screen-1.png',
      'https://cdn.example/path/screen-2.png',
    ]);
  });

  it('leaves absolute URLs untouched', () => {
    const project = normalizeFeaturedProject(
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        title: 'Demo',
        tagline: null,
        description: null,
        technologies: [],
        project_media_assets: [
          { type: 'poster', storage_path: 'https://images.unsplash.com/demo.jpg' },
        ],
      },
      {
        resolveStoragePath: (path) => `https://cdn.example/${path}`,
      },
    );

    expect(project.posterUrl).toBe('https://images.unsplash.com/demo.jpg');
  });
});

describe('project editor media route contract', () => {
  it('loads owned media and renders the upload manager outside the core project form', () => {
    const editPage = readFileSync(
      resolve(
        process.cwd(),
        'src/app/dashboard/(authenticated)/projects/[id]/edit/page.tsx',
      ),
      'utf8',
    );

    expect(editPage).toContain('loadOwnedProjectMediaAssets');
    expect(editPage).toContain('<ProjectMediaUpload');
    expect(editPage).toContain('<ProjectForm');
    expect(editPage.indexOf('<ProjectMediaUpload')).toBeGreaterThan(
      editPage.indexOf('<ProjectForm'),
    );
  });
});

describe('public project media route contract', () => {
  it('resolves media URLs on public profile and project detail routes', () => {
    const profilePage = readFileSync(resolve(process.cwd(), 'src/app/[slug]/page.tsx'), 'utf8');
    const detailPage = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/projects/[id]/page.tsx'),
      'utf8',
    );

    expect(profilePage).toContain('createProjectMediaUrlResolver');
    expect(detailPage).toContain('createProjectMediaUrlResolver');
    expect(detailPage).toContain('normalizeFeaturedProject');
  });
});
