import { describe, expect, it, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PUBLIC_CACHE_SECONDS } from '@codecard/config';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { revalidatePath } from 'next/cache';
import {
  buildPublicOgImagePath,
  buildPublicProfilePath,
  buildPublicProjectPath,
  buildPublicResearchPath,
  getPublicCacheSeconds,
  normalizePublicCacheSegment,
  PUBLIC_ROUTE_REVALIDATE_SECONDS,
  publicProfileCacheTag,
  publicProjectCacheTag,
  publicResearchCacheTag,
  revalidatePublicProfile,
  revalidatePublicProfileSlugChange,
  revalidatePublicProject,
  revalidatePublicResearch,
  revalidatePublicResearchSlugChange,
} from './public-cache';

describe('public cache helpers', () => {
  beforeEach(() => {
    vi.mocked(revalidatePath).mockClear();
  });

  it('uses the centralized PUBLIC_CACHE_SECONDS duration', () => {
    expect(getPublicCacheSeconds()).toBe(PUBLIC_CACHE_SECONDS);
    expect(PUBLIC_ROUTE_REVALIDATE_SECONDS).toBe(PUBLIC_CACHE_SECONDS);
    expect(PUBLIC_CACHE_SECONDS).toBe(60);
  });

  it('rejects unsafe cache segments and builds deterministic paths/tags', () => {
    expect(normalizePublicCacheSegment('../evil')).toBeNull();
    expect(normalizePublicCacheSegment('javascript:alert(1)')).toBeNull();
    expect(normalizePublicCacheSegment('Ada-Lovelace')).toBe('ada-lovelace');
    expect(buildPublicProfilePath('Ada')).toBe('/ada');
    expect(buildPublicProjectPath('ada', 'proj-1')).toBe('/ada/projects/proj-1');
    expect(buildPublicResearchPath('ada', 'Notes')).toBe('/ada/research/notes');
    expect(buildPublicOgImagePath('/ada')).toBe('/ada/opengraph-image');
    expect(publicProfileCacheTag('ada')).toBe('public-profile-slug:ada');
    expect(publicProjectCacheTag('ada', 'proj-1')).toBe(
      'public-project-route:ada:projects:proj-1',
    );
    expect(publicResearchCacheTag('ada', 'notes')).toBe(
      'public-research-route:ada:research:notes',
    );
  });

  it('invalidates profile pages and social images', () => {
    revalidatePublicProfile('ada');
    expect(revalidatePath).toHaveBeenCalledWith('/ada');
    expect(revalidatePath).toHaveBeenCalledWith('/ada/opengraph-image');
  });

  it('invalidates old and new profile slugs independently', () => {
    revalidatePublicProfileSlugChange({
      previousSlug: 'old-ada',
      nextSlug: 'new-ada',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/old-ada');
    expect(revalidatePath).toHaveBeenCalledWith('/old-ada/opengraph-image');
    expect(revalidatePath).toHaveBeenCalledWith('/new-ada');
    expect(revalidatePath).toHaveBeenCalledWith('/new-ada/opengraph-image');
  });

  it('invalidates project and research detail plus parent profile', () => {
    revalidatePublicProject('ada', 'proj-1');
    expect(revalidatePath).toHaveBeenCalledWith('/ada');
    expect(revalidatePath).toHaveBeenCalledWith('/ada/projects/proj-1');
    expect(revalidatePath).toHaveBeenCalledWith('/ada/projects/proj-1/opengraph-image');

    vi.mocked(revalidatePath).mockClear();
    revalidatePublicResearch('ada', 'notes');
    expect(revalidatePath).toHaveBeenCalledWith('/ada');
    expect(revalidatePath).toHaveBeenCalledWith('/ada/research/notes');
    expect(revalidatePath).toHaveBeenCalledWith('/ada/research/notes/opengraph-image');
  });

  it('invalidates previous and next research slug routes', () => {
    revalidatePublicResearchSlugChange({
      profileSlug: 'ada',
      previousSlug: 'old-notes',
      nextSlug: 'new-notes',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/ada/research/old-notes');
    expect(revalidatePath).toHaveBeenCalledWith('/ada/research/new-notes');
  });

  it('does not invent routes from malformed slug input', () => {
    revalidatePublicProfile('../x');
    revalidatePublicProject('ada', '../y');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('public cache wiring contracts', () => {
  it('public routes export a literal revalidate matching PUBLIC_CACHE_SECONDS', () => {
    const profile = readFileSync(resolve(process.cwd(), 'src/app/[slug]/page.tsx'), 'utf8');
    const project = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/projects/[id]/page.tsx'),
      'utf8',
    );
    const research = readFileSync(
      resolve(process.cwd(), 'src/app/[slug]/research/[paperSlug]/page.tsx'),
      'utf8',
    );
    expect(PUBLIC_CACHE_SECONDS).toBe(60);
    expect(profile).toContain('export const revalidate = 60');
    expect(project).toContain('export const revalidate = 60');
    expect(research).toContain('export const revalidate = 60');
    expect(profile).toContain('PUBLIC_CACHE_SECONDS');
    expect(project).toContain('PUBLIC_CACHE_SECONDS');
    expect(research).toContain('PUBLIC_CACHE_SECONDS');
  });

  it('mutations invalidate public pages through helpers', () => {
    const publish = readFileSync(
      resolve(process.cwd(), 'src/lib/profile/publish-profile-action.ts'),
      'utf8',
    );
    const update = readFileSync(
      resolve(process.cwd(), 'src/lib/profile/update-profile-action.ts'),
      'utf8',
    );
    const projectRevalidate = readFileSync(
      resolve(process.cwd(), 'src/lib/projects/project-revalidate.ts'),
      'utf8',
    );
    const researchRevalidate = readFileSync(
      resolve(process.cwd(), 'src/lib/research/research-revalidate.ts'),
      'utf8',
    );
    const researchActions = readFileSync(
      resolve(process.cwd(), 'src/app/actions/research.ts'),
      'utf8',
    );
    const projectActions = readFileSync(
      resolve(process.cwd(), 'src/app/actions/projects.ts'),
      'utf8',
    );

    expect(publish).toContain('revalidatePublicProfile');
    expect(publish).toContain('unpublishProfileAction');
    expect(update).toContain('revalidatePublicProfileSlugChange');
    expect(projectRevalidate).toContain('revalidatePublicProject');
    expect(researchRevalidate).toContain('revalidatePublicResearch');
    expect(researchRevalidate).toContain('revalidatePublicResearchSlugChange');
    const cache = readFileSync(resolve(process.cwd(), 'src/lib/profile/public-cache.ts'), 'utf8');
    expect(cache).toContain('opengraph-image');
    expect(researchActions).toContain('previousPaperSlug');
    expect(researchActions).toContain('touchPublicRoutes: true');
    expect(projectActions).toContain('touchPublicRoutes: true');
  });

  it('keeps public loaders free of service-role and private dashboard payload caching', () => {
    const loader = readFileSync(
      resolve(process.cwd(), 'src/lib/profile/public-profile.ts'),
      'utf8',
    );
    const cache = readFileSync(resolve(process.cwd(), 'src/lib/profile/public-cache.ts'), 'utf8');
    expect(loader).toContain("eq('is_public', true)");
    expect(loader).not.toContain('createServiceClient');
    expect(cache).not.toContain('createServiceClient');
    // Page loaders may use tagged data cache; this module must not wrap private payloads.
    expect(cache).not.toMatch(/\bunstable_cache\s*\(/);
  });
});
