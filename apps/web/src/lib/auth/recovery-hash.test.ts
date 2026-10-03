import { describe, expect, it } from 'vitest';
import { parseRecoveryHash } from './recovery-hash';

describe('parseRecoveryHash', () => {
  it('reads both tokens from an implicit recovery fragment', () => {
    expect(
      parseRecoveryHash('#access_token=access-1&refresh_token=refresh-1&type=recovery'),
    ).toEqual({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
  });

  it('accepts a fragment without the leading hash', () => {
    expect(parseRecoveryHash('access_token=a&refresh_token=b')).toEqual({
      accessToken: 'a',
      refreshToken: 'b',
    });
  });

  it('returns null when either token is missing', () => {
    expect(parseRecoveryHash('#access_token=only')).toBeNull();
    expect(parseRecoveryHash('#type=recovery')).toBeNull();
    expect(parseRecoveryHash('')).toBeNull();
  });
});
