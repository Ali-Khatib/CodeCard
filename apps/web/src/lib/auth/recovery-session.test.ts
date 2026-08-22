import { describe, expect, it } from 'vitest';
import {
  isRecoveryAllowedPath,
  PASSWORD_RECOVERY_APP_METADATA_KEY,
  userHasPasswordRecoveryPrivilege,
} from './recovery-session';

describe('recovery session privilege', () => {
  it('detects server-stamped app_metadata recovery flag', () => {
    expect(
      userHasPasswordRecoveryPrivilege({
        app_metadata: { [PASSWORD_RECOVERY_APP_METADATA_KEY]: true },
      }),
    ).toBe(true);
    expect(
      userHasPasswordRecoveryPrivilege({
        app_metadata: { [PASSWORD_RECOVERY_APP_METADATA_KEY]: false },
      }),
    ).toBe(false);
    expect(userHasPasswordRecoveryPrivilege({ app_metadata: {} })).toBe(false);
    expect(userHasPasswordRecoveryPrivilege(null)).toBe(false);
  });

  it('allows only reset/callback/recovery helper paths', () => {
    expect(isRecoveryAllowedPath('/reset-password')).toBe(true);
    expect(isRecoveryAllowedPath('/auth/callback')).toBe(true);
    expect(isRecoveryAllowedPath('/auth/mark-recovery')).toBe(true);
    expect(isRecoveryAllowedPath('/api/auth/complete-password-reset')).toBe(true);
    expect(isRecoveryAllowedPath('/dashboard')).toBe(false);
    expect(isRecoveryAllowedPath('/dashboard/billing')).toBe(false);
    expect(isRecoveryAllowedPath('/admin')).toBe(false);
  });
});
