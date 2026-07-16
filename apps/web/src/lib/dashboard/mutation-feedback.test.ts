import { describe, expect, it } from 'vitest';
import {
  MUTATION_FEEDBACK,
  sanitizeMutationError,
} from './mutation-feedback';

describe('WS09-T012 mutation feedback sanitization', () => {
  it('allows known product messages', () => {
    expect(sanitizeMutationError(MUTATION_FEEDBACK.profile.saved)).toBe(
      MUTATION_FEEDBACK.profile.saved,
    );
    expect(sanitizeMutationError(MUTATION_FEEDBACK.project.deleted)).toBe(
      MUTATION_FEEDBACK.project.deleted,
    );
  });

  it('allows short validation-style guidance', () => {
    expect(sanitizeMutationError('Title is required.')).toBe('Title is required.');
  });

  it('blocks raw database and provider internals', () => {
    expect(
      sanitizeMutationError('duplicate key value violates unique constraint "profiles_slug_key"'),
    ).toBe(MUTATION_FEEDBACK.genericFailure);
    expect(sanitizeMutationError('PostgREST PGRST116: JSON object requested')).toBe(
      MUTATION_FEEDBACK.genericFailure,
    );
    expect(sanitizeMutationError('JWT expired for user_id abc')).toBe(
      MUTATION_FEEDBACK.genericFailure,
    );
    expect(sanitizeMutationError('storage/bucket/avatars/path failed')).toBe(
      MUTATION_FEEDBACK.genericFailure,
    );
    expect(sanitizeMutationError('sk_test_example_secret')).toBe(MUTATION_FEEDBACK.genericFailure);
  });

  it('falls back for empty, oversized, or non-string errors', () => {
    expect(sanitizeMutationError('')).toBe(MUTATION_FEEDBACK.genericFailure);
    expect(sanitizeMutationError(null)).toBe(MUTATION_FEEDBACK.genericFailure);
    expect(sanitizeMutationError({ message: 'nope' })).toBe(MUTATION_FEEDBACK.genericFailure);
    expect(sanitizeMutationError('x'.repeat(200))).toBe(MUTATION_FEEDBACK.genericFailure);
  });
});
