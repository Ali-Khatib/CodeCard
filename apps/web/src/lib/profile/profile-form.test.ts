import { describe, expect, it } from 'vitest';
import type { Profile } from '@codecard/types';
import {
  formStateToUpdatePayload,
  parseProfileUpdate,
  profileToFormState,
} from './profile-form';

const baseProfile: Profile = {
  id: 'profile-1',
  tenant_id: 'tenant-1',
  owner_user_id: 'user-1',
  slug: 'alex-chen',
  display_name: 'Alex Chen',
  headline: 'Senior AI Engineer · Stripe',
  avatar_url: null,
  bio: 'Builder',
  location: 'San Francisco, CA',
  skills: ['TypeScript', 'Next.js'],
  is_public: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('profileToFormState', () => {
  it('loads location and skills from persisted profile', () => {
    const form = profileToFormState(baseProfile);
    expect(form.location).toBe('San Francisco, CA');
    expect(form.skillsInput).toBe('TypeScript, Next.js');
  });

  it('handles profiles without location or skills', () => {
    const form = profileToFormState({
      ...baseProfile,
      location: null,
      skills: [],
    });
    expect(form.location).toBe('');
    expect(form.skillsInput).toBe('');
  });
});

describe('parseProfileUpdate', () => {
  it('builds update payload that includes location and skills', () => {
    const form = profileToFormState(baseProfile);
    const parsed = parseProfileUpdate({
      ...form,
      location: 'London, UK',
      skillsInput: 'Go, Rust, Go',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.location).toBe('London, UK');
      expect(parsed.data.skills).toEqual(['Go', 'Rust']);
    }
  });

  it('rejects duplicate skills in comma-separated input after normalization', () => {
    const form = profileToFormState(baseProfile);
    const parsed = parseProfileUpdate({
      ...form,
      skillsInput: 'TypeScript, typescript',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.skills).toEqual(['TypeScript']);
    }
  });

  it('returns field errors for invalid location', () => {
    const form = profileToFormState(baseProfile);
    const parsed = parseProfileUpdate({
      ...form,
      location: 'a'.repeat(121),
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.message.length).toBeGreaterThan(0);
    }
  });

  it('preserves other profile fields in update payload', () => {
    const payload = formStateToUpdatePayload(profileToFormState(baseProfile));
    expect(payload.display_name).toBe('Alex Chen');
    expect(payload.slug).toBe('alex-chen');
    expect(payload.is_public).toBe(false);
  });
});
