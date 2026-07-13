import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildCreateProjectFormData,
  createEmptyProjectFormValues,
  validateProjectFormClient,
} from './project-form';
import { PROJECT_DOMAIN_OPTIONS, PROJECT_FOCUS_AREA_OPTIONS } from '@codecard/validation';

describe('project form failure recovery', () => {
  it('keeps controlled values available for retry serialization', () => {
    const values = {
      ...createEmptyProjectFormValues(),
      title: 'Retry Project',
      slug: 'retry-project',
      tagline: 'Still here',
      description: 'Preserved body',
      technologies: ['Go', 'Rust'],
      domains: [PROJECT_DOMAIN_OPTIONS[1]],
      focus_areas: [PROJECT_FOCUS_AREA_OPTIONS[1]],
      user_role: 'Contributor',
      started_at: '2024-02-01',
      ended_at: '2024-08-01',
      status: 'active' as const,
    };

    const failedValidation = validateProjectFormClient({
      ...values,
      slug: '../bad',
    });
    expect(failedValidation.success).toBe(false);

    const retryPayload = buildCreateProjectFormData({
      ...values,
      slug: 'retry-project-fixed',
    });

    expect(retryPayload.get('title')).toBe('Retry Project');
    expect(retryPayload.get('slug')).toBe('retry-project-fixed');
    expect(retryPayload.get('tagline')).toBe('Still here');
    expect(retryPayload.getAll('technologies')).toEqual(['Go', 'Rust']);
    expect(retryPayload.getAll('domains')).toEqual([PROJECT_DOMAIN_OPTIONS[1]]);
    expect(retryPayload.get('user_role')).toBe('Contributor');
    expect(retryPayload.get('started_at')).toBe('2024-02-01');
    expect(retryPayload.get('ended_at')).toBe('2024-08-01');
    expect(retryPayload.get('status')).toBe('active');
  });
});

describe('project form recovery UI contract', () => {
  it('implements retry, duplicate protection, and preserved state in the create form', () => {
    const form = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/project-form.tsx'),
      'utf8',
    );

    expect(form).toContain('isRecoverableProjectFailure');
    expect(form).toContain('completedRef');
    expect(form).toContain('recoverableError');
    expect(form).toContain('Try again');
    expect(form).toContain('handleRetry');
    expect(form).toContain('slugInputRef');
    expect(form).toContain('handleSessionExpired');
    expect(form).toContain('aria-busy={pending}');
    expect(form).toContain('aria-live="polite"');
    expect(form).not.toContain('setForm(createEmptyProjectFormValues');
  });
});
