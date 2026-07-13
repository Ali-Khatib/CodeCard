import { describe, expect, it } from 'vitest';
import {
  findForbiddenUpdateProjectFields,
  updateProjectInputSchema,
  PROJECT_DOMAIN_OPTIONS,
  PROJECT_FOCUS_AREA_OPTIONS,
} from './index';

describe('updateProjectInputSchema', () => {
  const validPayload = {
    project_id: '11111111-1111-4111-8111-111111111111',
    title: 'DevFlow',
    slug: 'dev-flow',
    tagline: 'Ship faster',
    description: 'A developer workflow tool.',
    technologies: ['TypeScript'],
    domains: [PROJECT_DOMAIN_OPTIONS[0]],
    focus_areas: [PROJECT_FOCUS_AREA_OPTIONS[0]],
    user_role: 'Lead Engineer',
    started_at: '2024-01-15',
    ended_at: '2024-06-01',
    status: 'active' as const,
  };

  it('accepts valid update payload', () => {
    expect(updateProjectInputSchema.safeParse(validPayload).success).toBe(true);
  });

  it('requires project id', () => {
    expect(updateProjectInputSchema.safeParse({ ...validPayload, project_id: '' }).success).toBe(false);
  });

  it('rejects invalid slug', () => {
    expect(updateProjectInputSchema.safeParse({ ...validPayload, slug: '../bad' }).success).toBe(false);
  });

  it('rejects unexpected ownership fields', () => {
    expect(
      updateProjectInputSchema.safeParse({ ...validPayload, owner_user_id: 'evil' }).success,
    ).toBe(false);
  });
});

describe('findForbiddenUpdateProjectFields', () => {
  it('rejects trusted ownership fields', () => {
    expect(findForbiddenUpdateProjectFields({ tenant_id: 'evil' })).toContain('tenant_id');
    expect(findForbiddenUpdateProjectFields({ is_published: true })).toContain('is_published');
  });
});
