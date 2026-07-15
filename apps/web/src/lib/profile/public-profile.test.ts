import { describe, expect, it, vi } from 'vitest';
import {
  assertNoForbiddenPublicKeys,
  FORBIDDEN_PUBLIC_PROFILE_KEYS,
  loadPublicProfileBySlug,
  mapPublicProfileMetadata,
  normalizePublicProfileSlug,
  PUBLIC_PROFILE_PROJECT_SELECT,
  PUBLIC_PROFILE_RESEARCH_SELECT,
  PUBLIC_PROFILE_SELECT,
} from './public-profile';

describe('normalizePublicProfileSlug', () => {
  it('accepts valid slugs and rejects malformed ones', () => {
    expect(normalizePublicProfileSlug('Alex-Chen')).toBe('alex-chen');
    expect(normalizePublicProfileSlug('ab')).toBeNull();
    expect(normalizePublicProfileSlug('../evil')).toBeNull();
    expect(normalizePublicProfileSlug('javascript:alert(1)')).toBeNull();
    expect(normalizePublicProfileSlug('')).toBeNull();
  });
});

describe('mapPublicProfileMetadata', () => {
  it('returns noindex metadata for missing/private profiles', () => {
    expect(mapPublicProfileMetadata(null)).toEqual({
      title: 'Profile not found',
      description: 'This profile could not be found on CodeCard.',
      robots: { index: false, follow: false },
    });
  });

  it('uses headline or CodeCard fallback for public profiles', () => {
    expect(
      mapPublicProfileMetadata({ display_name: 'Ada', headline: 'Builder' }),
    ).toEqual({
      title: 'Ada',
      description: 'Builder',
    });
    expect(
      mapPublicProfileMetadata({ display_name: 'Ada', headline: null }),
    ).toEqual({
      title: 'Ada',
      description: 'Ada on CodeCard',
    });
  });
});

describe('assertNoForbiddenPublicKeys', () => {
  it('detects ownership and billing fields recursively', () => {
    const found = assertNoForbiddenPublicKeys({
      displayName: 'Ada',
      nested: { owner_user_id: 'x', projects: [{ tenant_id: 't' }] },
    });
    expect(found).toEqual(expect.arrayContaining(['owner_user_id', 'tenant_id']));
    expect(FORBIDDEN_PUBLIC_PROFILE_KEYS).toContain('email');
  });
});

describe('loadPublicProfileBySlug', () => {
  it('returns null for malformed slugs without querying', async () => {
    const from = vi.fn();
    const result = await loadPublicProfileBySlug({ from } as never, '../evil');
    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it('returns null when profile is missing or not public', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqIsPublic = vi.fn(() => ({ maybeSingle }));
    const eqSlug = vi.fn(() => ({ eq: eqIsPublic }));
    const select = vi.fn(() => ({ eq: eqSlug }));
    const from = vi.fn(() => ({ select }));

    const result = await loadPublicProfileBySlug({ from } as never, 'missing-user');
    expect(result).toBeNull();
    expect(select).toHaveBeenCalled();
    const firstCall = select.mock.calls[0] as unknown as [string] | undefined;
    const selectArg = String(firstCall?.[0] ?? '');
    expect(selectArg).toContain('is_public');
    expect(selectArg).toContain('is_published');
    expect(selectArg).not.toMatch(/\b\*\b/);
  });

  it('filters draft projects and research before mapping', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'profile-1',
        slug: 'ada-lovelace',
        display_name: 'Ada',
        headline: 'Analyst',
        bio: 'Bio',
        avatar_url: null,
        location: null,
        is_public: true,
        profile_links: [
          { type: 'website', label: 'Site', url: 'https://example.com', sort_order: 0 },
          { type: 'website', label: 'Bad', url: 'javascript:alert(1)', sort_order: 1 },
        ],
        projects: [
          {
            id: 'proj-draft',
            title: 'Draft Project',
            tagline: null,
            description: null,
            technologies: [],
            case_study_sections: null,
            sort_order: 0,
            created_at: '2026-01-01T00:00:00Z',
            is_published: false,
            project_domains: [],
            project_focus_areas: [],
            project_media_assets: [],
            project_links: [],
          },
          {
            id: 'proj-pub',
            title: 'Published Project',
            tagline: null,
            description: null,
            technologies: ['TS'],
            case_study_sections: null,
            sort_order: 1,
            created_at: '2026-01-02T00:00:00Z',
            is_published: true,
            project_domains: [],
            project_focus_areas: [],
            project_media_assets: [],
            project_links: [],
          },
        ],
        research_papers: [
          {
            id: 'paper-draft',
            slug: 'draft-paper',
            title: 'Draft Paper',
            abstract: null,
            authors: [],
            venue: null,
            publication_status: null,
            year: null,
            pdf_url: null,
            doi_url: null,
            citation_text: null,
            tags: [],
            cover_image_url: null,
            related_project_id: null,
            sort_order: 0,
            created_at: '2026-01-01T00:00:00Z',
            is_published: false,
            research_figures: [],
            related_project: null,
          },
          {
            id: 'paper-pub',
            slug: 'pub-paper',
            title: 'Published Paper',
            abstract: 'Hello',
            authors: ['Ada'],
            venue: null,
            publication_status: null,
            year: 2024,
            pdf_url: 'https://example.com/a.pdf',
            doi_url: null,
            citation_text: null,
            tags: [],
            cover_image_url: null,
            related_project_id: null,
            sort_order: 1,
            created_at: '2026-01-02T00:00:00Z',
            is_published: true,
            research_figures: [],
            related_project: { id: 'proj-draft', title: 'Draft Project', is_published: false },
          },
        ],
      },
      error: null,
    });

    const eqIsPublic = vi.fn(() => ({ maybeSingle }));
    const eqSlug = vi.fn(() => ({ eq: eqIsPublic }));
    const select = vi.fn(() => ({ eq: eqSlug }));
    const from = vi.fn((table: string) => {
      if (table === 'profiles') return { select };
      if (table === 'project_orderings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        };
      }
      return {
        storage: undefined,
      };
    });

    const supabase = {
      from,
      storage: {
        from: () => ({
          getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }),
        }),
      },
    };

    const result = await loadPublicProfileBySlug(supabase as never, 'Ada-Lovelace');
    expect(result).not.toBeNull();
    expect(result!.projects.map((p) => p.id)).toEqual(['proj-pub']);
    expect(result!.projects.some((p) => p.title === 'Draft Project')).toBe(false);
    expect(result!.researchPapers.map((p) => p.slug)).toEqual(['pub-paper']);
    expect(result!.researchPapers.some((p) => p.slug === 'draft-paper')).toBe(false);
    expect(result!.researchPapers[0]?.relatedProjectId).toBeNull();
    expect(result!.links.map((l) => l.url)).toEqual(['https://example.com']);
    expect(assertNoForbiddenPublicKeys(result)).toEqual([]);
    expect(JSON.stringify(result)).not.toContain('tenant_id');
    expect(JSON.stringify(result)).not.toContain('owner_user_id');
    expect(JSON.stringify(result)).not.toContain('proj-draft');
  });
});

describe('public profile select contracts', () => {
  it('keeps explicit published-aware project and research select fragments', () => {
    expect(PUBLIC_PROFILE_PROJECT_SELECT).toContain('is_published');
    expect(PUBLIC_PROFILE_PROJECT_SELECT).not.toContain('owner_user_id');
    expect(PUBLIC_PROFILE_RESEARCH_SELECT).toContain('is_published');
    expect(PUBLIC_PROFILE_RESEARCH_SELECT).toContain('research_figures');
    expect(PUBLIC_PROFILE_SELECT).toContain('is_public');
    expect(PUBLIC_PROFILE_SELECT).not.toContain('tenant_id');
  });
});
