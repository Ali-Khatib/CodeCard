import { describe, expect, it } from 'vitest';
import { profileViewAudienceMetadata } from './viewer-audience-role';

describe('profileViewAudienceMetadata', () => {
  it('stores the signed-in viewer role and drops a client claim', () => {
    expect(
      profileViewAudienceMetadata({ audience_role: 'student', source: 'qr' }, 'recruiter'),
    ).toEqual({ source: 'qr', audience_role: 'recruiter' });
  });

  it('omits a role when the viewer has not chosen one', () => {
    expect(profileViewAudienceMetadata({ audience_role: 'founder' }, null)).toEqual({});
    expect(profileViewAudienceMetadata({}, 'intern')).toEqual({});
  });
});
