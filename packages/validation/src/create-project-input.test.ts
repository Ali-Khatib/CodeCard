import { describe, expect, it } from 'vitest';
import {
  createProjectInputSchema,
  findForbiddenCreateProjectFields,
  normalizeProjectTechnologies,
  PROJECT_DOMAIN_OPTIONS,
  PROJECT_FOCUS_AREA_OPTIONS,
  PROJECT_SLUG_TAKEN_MESSAGE,
} from './index';

describe('createProjectInputSchema', () => {
  const validPayload = {
    title: 'DevFlow',
    slug: 'dev-flow',
    tagline: 'Ship faster',
    description: 'A developer workflow tool.',
    technologies: ['TypeScript', 'Next.js', 'C++'],
    domains: [PROJECT_DOMAIN_OPTIONS[0]],
    focus_areas: [PROJECT_FOCUS_AREA_OPTIONS[0]],
    user_role: 'Lead Engineer',
    started_at: '2024-01-15',
    ended_at: '2024-06-01',
    status: 'completed' as const,
  };

  it('accepts a valid complete payload', () => {
    const result = createProjectInputSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('requires title', () => {
    const result = createProjectInputSchema.safeParse({ ...validPayload, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects overlong title', () => {
    const result = createProjectInputSchema.safeParse({
      ...validPayload,
      title: 'a'.repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid slug', () => {
    const result = createProjectInputSchema.safeParse({
      ...validPayload,
      slug: '../escape',
    });
    expect(result.success).toBe(false);
  });

  it('normalizes duplicate technologies', () => {
    const result = createProjectInputSchema.parse({
      ...validPayload,
      technologies: ['Next.js', 'next.js', 'TypeScript'],
    });
    expect(result.technologies).toEqual(['Next.js', 'TypeScript']);
  });

  it('rejects invalid date range', () => {
    const result = createProjectInputSchema.safeParse({
      ...validPayload,
      started_at: '2024-06-01',
      ended_at: '2024-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unsupported status', () => {
    const result = createProjectInputSchema.safeParse({
      ...validPayload,
      status: 'archived',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unsupported domain', () => {
    const result = createProjectInputSchema.safeParse({
      ...validPayload,
      domains: ['Unknown Domain'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unsupported focus area', () => {
    const result = createProjectInputSchema.safeParse({
      ...validPayload,
      focus_areas: ['Unknown Area'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unexpected ownership fields', () => {
    const result = createProjectInputSchema.safeParse({
      ...validPayload,
      owner_user_id: 'evil',
    });
    expect(result.success).toBe(false);
  });
});

describe('findForbiddenCreateProjectFields', () => {
  it('flags trusted ownership fields', () => {
    expect(findForbiddenCreateProjectFields({ title: 'x', tenant_id: 'evil' })).toContain(
      'tenant_id',
    );
    expect(findForbiddenCreateProjectFields({ is_published: true })).toContain('is_published');
    expect(findForbiddenCreateProjectFields({ plan: 'pro' })).toContain('plan');
  });
});

describe('normalizeProjectTechnologies', () => {
  it('preserves first-entered capitalization', () => {
    expect(normalizeProjectTechnologies(['C++', 'c++', 'Node.js'])).toEqual(['C++', 'Node.js']);
  });
});

describe('PROJECT_SLUG_TAKEN_MESSAGE', () => {
  it('is user friendly', () => {
    expect(PROJECT_SLUG_TAKEN_MESSAGE).toBe('This project URL is already in use.');
  });
});
