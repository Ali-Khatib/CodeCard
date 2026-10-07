import { describe, expect, it } from 'vitest';
import { FOUNDER_PROFILE_ID, FOUNDER_PROFILE_SLUG, isFounderProfile } from '@/lib/profile/founder';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('founder public treatment', () => {
  it('gates only the founder account', () => {
    expect(isFounderProfile({ profileId: FOUNDER_PROFILE_ID })).toBe(true);
    expect(isFounderProfile({ profileSlug: FOUNDER_PROFILE_SLUG })).toBe(true);
    expect(isFounderProfile({ profileSlug: 'ccmvp' })).toBe(false);
    expect(isFounderProfile({ profileId: '00000000-0000-0000-0000-000000000000' })).toBe(false);
  });

  it('wires greeting + founder class into the public shell', () => {
    const focused = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-focused.tsx'),
      'utf8',
    );
    expect(focused).toContain('isFounderProfile');
    expect(focused).toContain('FounderGreeting');
    expect(focused).toContain('cc-public-profile--founder');
  });
});
