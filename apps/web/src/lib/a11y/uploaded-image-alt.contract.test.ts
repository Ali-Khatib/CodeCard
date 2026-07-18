import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  avatarImageAlt,
  looksLikeFilenameAlt,
  projectCoverAlt,
  projectScreenshotAlt,
  researchFigureImageAlt,
} from './uploaded-image-alt';

const WEB = resolve(process.cwd());

function read(rel: string) {
  return readFileSync(resolve(WEB, 'src', rel), 'utf8');
}

describe('WS12-T009 uploaded image alt text', () => {
  it('defines avatar informative vs redundant rules', () => {
    expect(avatarImageAlt({ displayName: 'Alex Chen' })).toBe('Alex Chen avatar');
    expect(avatarImageAlt({ displayName: 'Alex Chen', nameAlreadyAnnounced: true })).toBe('');
  });

  it('treats title-adjacent project covers as decorative', () => {
    expect(projectCoverAlt({ projectTitle: 'DevFlow', titleAdjacent: true })).toBe('');
    expect(projectCoverAlt({ projectTitle: 'DevFlow', titleAdjacent: false })).toBe(
      'DevFlow cover image',
    );
  });

  it('names project screenshots without filenames', () => {
    expect(projectScreenshotAlt({ projectTitle: 'DevFlow', index: 0 })).toBe(
      'DevFlow screenshot 1',
    );
    expect(looksLikeFilenameAlt('shot.png')).toBe(true);
    expect(looksLikeFilenameAlt('DevFlow screenshot 1')).toBe(false);
  });

  it('uses caption for research figures and empty alt when caption is nearby', () => {
    expect(
      researchFigureImageAlt({ caption: 'Throughput improved 2x', captionVisibleNearby: true }),
    ).toBe('');
    expect(
      researchFigureImageAlt({ caption: 'Throughput improved 2x', captionVisibleNearby: false }),
    ).toBe('Throughput improved 2x');
    expect(researchFigureImageAlt({ caption: null })).toBe('Research figure');
  });

  it('wires project detail and figure authoring to the alt rules', () => {
    const detail = read('components/featured-work/project-detail-view.tsx');
    expect(detail).toContain('projectCoverAlt');
    expect(detail).toContain('projectScreenshotAlt');
    expect(detail).not.toMatch(/alt=\{[^}]*storage_path/);
    expect(detail).not.toMatch(/alt=\{[^}]*filename/);

    const figures = read('components/dashboard/research-figure-manager.tsx');
    expect(figures).toContain('htmlFor={`caption-${figure.id}`}');
    expect(figures).toContain('aria-describedby={`caption-help-${figure.id}`}');
    expect(figures).toContain('Do not paste filenames');

    const publicStack = read('components/profile/public-project-stack.tsx');
    expect(publicStack).toContain('alt=""');
  });

  it('keeps avatar alt helper non-filename based', () => {
    const avatar = read('lib/profile/avatar-url.ts');
    expect(avatar).toContain('profileAvatarAltText');
    expect(avatar).toContain('avatar');
    expect(avatar).not.toContain('storage_path');
  });
});
