import { describe, expect, it } from 'vitest';
import type { Project } from '@codecard/types';
import {
  dbProjectToPortfolioProject,
  featuredToPortfolioProject,
} from '@/lib/dashboard/portfolio';
import { normalizeFeaturedProject } from '@/lib/projects/featured';
import { DEMO_FEATURED_PROJECTS } from '@/lib/projects/demo-data';

const baseProject: Project = {
  id: '11111111-1111-4111-8111-111111111111',
  tenant_id: '22222222-2222-4222-8222-222222222222',
  profile_id: '33333333-3333-4333-8333-333333333333',
  owner_user_id: '44444444-4444-4444-8444-444444444444',
  title: 'DevFlow',
  slug: 'devflow',
  tagline: 'CI/CD pipelines',
  description: 'Description',
  technologies: ['TypeScript'],
  user_role: null,
  started_at: null,
  ended_at: null,
  status: null,
  is_published: true,
  sort_order: 0,
  case_study_sections: {},
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('project type compatibility', () => {
  it('maps database projects with new fields through portfolio helpers', () => {
    const portfolio = dbProjectToPortfolioProject({
      id: baseProject.id,
      title: baseProject.title,
      tagline: baseProject.tagline,
      description: baseProject.description,
      is_published: baseProject.is_published,
      technologies: baseProject.technologies,
      case_study_sections: baseProject.case_study_sections,
      project_media_assets: [],
      project_links: [],
    });

    expect(portfolio.title).toBe('DevFlow');
    expect(portfolio.href).toContain(baseProject.id);
  });

  it('normalizes featured projects without requiring new presentation fields', () => {
    const featured = normalizeFeaturedProject({
      id: baseProject.id,
      title: baseProject.title,
      tagline: baseProject.tagline,
      description: baseProject.description,
      technologies: baseProject.technologies,
      project_domains: [{ name: 'Cloud Computing' }],
      project_focus_areas: [{ name: 'DevOps' }],
      project_media_assets: [],
      project_links: [],
      case_study_sections: {},
    });

    expect(featured.domains).toEqual(['Cloud Computing']);
    expect(featuredToPortfolioProject(featured).title).toBe('DevFlow');
  });

  it('keeps demo fixtures valid as presentation-only data', () => {
    expect(DEMO_FEATURED_PROJECTS.length).toBeGreaterThan(0);
    expect(DEMO_FEATURED_PROJECTS[0]?.title).toBeTruthy();
  });
});
