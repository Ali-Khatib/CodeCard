import { describe, expect, it } from 'vitest';
import {
  buildCreateProjectFormData,
  createEmptyProjectFormValues,
  suggestProjectSlugFromTitle,
  validateProjectFormClient,
} from './project-form';
import { PROJECT_DOMAIN_OPTIONS, PROJECT_FOCUS_AREA_OPTIONS } from '@codecard/validation';

describe('suggestProjectSlugFromTitle', () => {
  it('suggests a slug from the title', () => {
    expect(suggestProjectSlugFromTitle('Dev Flow')).toBe('dev-flow');
  });
});

describe('validateProjectFormClient', () => {
  it('accepts valid values', () => {
    const values = {
      ...createEmptyProjectFormValues(),
      title: 'DevFlow',
      slug: 'dev-flow',
      technologies: ['TypeScript'],
      domains: [PROJECT_DOMAIN_OPTIONS[0]],
      focus_areas: [PROJECT_FOCUS_AREA_OPTIONS[0]],
    };
    expect(validateProjectFormClient(values).success).toBe(true);
  });

  it('rejects missing title', () => {
    const values = {
      ...createEmptyProjectFormValues(),
      slug: 'dev-flow',
    };
    expect(validateProjectFormClient(values).success).toBe(false);
  });
});

describe('buildCreateProjectFormData', () => {
  it('serializes controlled values for the server action', () => {
    const fd = buildCreateProjectFormData({
      ...createEmptyProjectFormValues(),
      title: 'DevFlow',
      slug: 'dev-flow',
      technologies: ['Next.js'],
      domains: [PROJECT_DOMAIN_OPTIONS[0]],
      focus_areas: [PROJECT_FOCUS_AREA_OPTIONS[0]],
      status: 'draft',
    });

    expect(fd.get('title')).toBe('DevFlow');
    expect(fd.get('slug')).toBe('dev-flow');
    expect(fd.getAll('technologies')).toEqual(['Next.js']);
    expect(fd.getAll('domains')).toEqual([PROJECT_DOMAIN_OPTIONS[0]]);
    expect(fd.get('status')).toBe('draft');
    expect(fd.get('is_published')).toBeNull();
  });
});
