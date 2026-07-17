import { describe, expect, it } from 'vitest';
import {
  GLOBAL_ADMIN_APP_METADATA_ROLE,
  GLOBAL_ADMIN_CLAIM_PATH,
  isGlobalAdminAuthorized,
  resolveGlobalAdminAuthorization,
  type TrustedAdminIdentity,
} from './admin-authorization';

function identity(
  partial: Partial<TrustedAdminIdentity> & Pick<TrustedAdminIdentity, 'userId'>,
): TrustedAdminIdentity {
  return partial;
}

describe('WS13-T001 resolveGlobalAdminAuthorization', () => {
  it('1. denies when there is no authenticated user', () => {
    expect(resolveGlobalAdminAuthorization(null)).toEqual({
      authorized: false,
      reason: 'unauthenticated',
    });
    expect(resolveGlobalAdminAuthorization(undefined)).toEqual({
      authorized: false,
      reason: 'unauthenticated',
    });
    expect(resolveGlobalAdminAuthorization(identity({ userId: null }))).toEqual({
      authorized: false,
      reason: 'unauthenticated',
    });
    expect(resolveGlobalAdminAuthorization(identity({ userId: '   ' }))).toEqual({
      authorized: false,
      reason: 'unauthenticated',
    });
  });

  it('2. denies when app metadata is missing', () => {
    expect(
      resolveGlobalAdminAuthorization(identity({ userId: 'user-1' })),
    ).toEqual({ authorized: false, reason: 'not_admin' });
    expect(
      resolveGlobalAdminAuthorization(identity({ userId: 'user-1', appMetadata: null })),
    ).toEqual({ authorized: false, reason: 'not_admin' });
  });

  it('3. denies when app metadata is empty', () => {
    expect(
      resolveGlobalAdminAuthorization(identity({ userId: 'user-1', appMetadata: {} })),
    ).toEqual({ authorized: false, reason: 'not_admin' });
  });

  it('4. accepts the exact canonical global admin role', () => {
    const decision = resolveGlobalAdminAuthorization(
      identity({
        userId: 'user-1',
        appMetadata: { role: GLOBAL_ADMIN_APP_METADATA_ROLE },
      }),
    );
    expect(decision).toEqual({ authorized: true, reason: 'global_admin' });
    expect(isGlobalAdminAuthorized(
      identity({ userId: 'user-1', appMetadata: { role: 'admin' } }),
    )).toBe(true);
    expect(GLOBAL_ADMIN_CLAIM_PATH).toBe('app_metadata.role');
  });

  it('5. rejects similar role strings', () => {
    for (const role of ['administrator', 'admins', 'platform_admin', 'moderator', 'owner']) {
      expect(
        resolveGlobalAdminAuthorization(
          identity({ userId: 'user-1', appMetadata: { role } }),
        ),
      ).toEqual({ authorized: false, reason: 'not_admin' });
    }
  });

  it('6. rejects different case (exact match policy)', () => {
    for (const role of ['Admin', 'ADMIN', 'AdMiN']) {
      expect(
        resolveGlobalAdminAuthorization(
          identity({ userId: 'user-1', appMetadata: { role } }),
        ),
      ).toEqual({ authorized: false, reason: 'not_admin' });
    }
  });

  it('7. rejects multi-role / array shapes (single string schema only)', () => {
    expect(
      resolveGlobalAdminAuthorization(
        identity({ userId: 'user-1', appMetadata: { role: ['admin'] } }),
      ),
    ).toEqual({ authorized: false, reason: 'misconfigured' });

    expect(
      resolveGlobalAdminAuthorization(
        identity({ userId: 'user-1', appMetadata: { roles: ['admin'] } }),
      ),
    ).toEqual({ authorized: false, reason: 'not_admin' });
  });

  it('8. does not authorize from user_metadata.role = admin', () => {
    // user_metadata is not part of TrustedAdminIdentity; smuggling it on a bag must not help.
    const smuggled = {
      userId: 'user-1',
      appMetadata: {},
      user_metadata: { role: 'admin' },
      userMetadata: { role: 'admin' },
    } as TrustedAdminIdentity & {
      user_metadata: { role: string };
      userMetadata: { role: string };
    };
    expect(resolveGlobalAdminAuthorization(smuggled)).toEqual({
      authorized: false,
      reason: 'not_admin',
    });
  });

  it('9. does not authorize from tenant_role = admin alone', () => {
    const smuggled = {
      userId: 'user-1',
      appMetadata: {},
      tenant_role: 'admin',
      tenantRole: 'admin',
    } as TrustedAdminIdentity & { tenant_role: string; tenantRole: string };
    expect(resolveGlobalAdminAuthorization(smuggled)).toEqual({
      authorized: false,
      reason: 'not_admin',
    });
  });

  it('10. does not authorize from a caller-supplied role field', () => {
    const smuggled = {
      userId: 'user-1',
      appMetadata: {},
      role: 'admin',
    } as TrustedAdminIdentity & { role: string };
    expect(resolveGlobalAdminAuthorization(smuggled)).toEqual({
      authorized: false,
      reason: 'not_admin',
    });
  });

  it('11. fails closed on malformed metadata', () => {
    expect(
      resolveGlobalAdminAuthorization(
        identity({ userId: 'user-1', appMetadata: { role: 1 } }),
      ),
    ).toEqual({ authorized: false, reason: 'misconfigured' });

    expect(
      resolveGlobalAdminAuthorization(
        identity({ userId: 'user-1', appMetadata: { role: { name: 'admin' } } }),
      ),
    ).toEqual({ authorized: false, reason: 'misconfigured' });

    expect(
      resolveGlobalAdminAuthorization(
        identity({
          userId: 'user-1',
          appMetadata: null as unknown as Record<string, unknown>,
        }),
      ),
    ).toEqual({ authorized: false, reason: 'not_admin' });

    expect(
      resolveGlobalAdminAuthorization(
        identity({
          userId: 'user-1',
          appMetadata: ['admin'] as unknown as Record<string, unknown>,
        }),
      ),
    ).toEqual({ authorized: false, reason: 'misconfigured' });
  });

  it('12. denies demo identities even with admin app_metadata', () => {
    expect(
      resolveGlobalAdminAuthorization(
        identity({
          userId: 'demo-user',
          isDemoIdentity: true,
          appMetadata: { role: 'admin' },
        }),
      ),
    ).toEqual({ authorized: false, reason: 'demo_identity' });
  });

  it('13–17. ignores environment allowlists and public admin env vars', () => {
    const prev = {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_EMAILS: process.env.ADMIN_EMAILS,
      NEXT_PUBLIC_ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      NEXT_PUBLIC_ADMIN_EMAILS: process.env.NEXT_PUBLIC_ADMIN_EMAILS,
    };

    process.env.ADMIN_EMAIL = 'ops@example.com';
    process.env.ADMIN_EMAILS = 'ops@example.com,other@example.com';
    process.env.NEXT_PUBLIC_ADMIN_EMAIL = 'ops@example.com';
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = 'ops@example.com';

    try {
      expect(
        resolveGlobalAdminAuthorization(
          identity({
            userId: 'user-1',
            appMetadata: {},
          }),
        ),
      ).toEqual({ authorized: false, reason: 'not_admin' });

      // Partial / domain matches are irrelevant — allowlist is not consulted.
      expect(
        resolveGlobalAdminAuthorization(
          identity({ userId: 'user-1', appMetadata: { role: 'admin@example.com' } }),
        ),
      ).toEqual({ authorized: false, reason: 'not_admin' });

      expect(
        resolveGlobalAdminAuthorization(
          identity({
            userId: 'user-1',
            appMetadata: { role: 'admin' },
          }),
        ),
      ).toEqual({ authorized: true, reason: 'global_admin' });
    } finally {
      for (const [key, value] of Object.entries(prev)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it('18. misconfiguration fails closed (authorized false)', () => {
    const decision = resolveGlobalAdminAuthorization(
      identity({ userId: 'user-1', appMetadata: { role: true } }),
    );
    expect(decision.authorized).toBe(false);
    expect(decision).toEqual({ authorized: false, reason: 'misconfigured' });
  });

  it('19. result reasons are stable', () => {
    const reasons = [
      resolveGlobalAdminAuthorization(null).reason,
      resolveGlobalAdminAuthorization(identity({ userId: 'u', appMetadata: {} })).reason,
      resolveGlobalAdminAuthorization(
        identity({ userId: 'u', appMetadata: { role: ['admin'] } }),
      ).reason,
      resolveGlobalAdminAuthorization(
        identity({ userId: 'u', isDemoIdentity: true, appMetadata: { role: 'admin' } }),
      ).reason,
      resolveGlobalAdminAuthorization(
        identity({ userId: 'u', appMetadata: { role: 'admin' } }),
      ).reason,
    ];
    expect(reasons).toEqual([
      'unauthenticated',
      'not_admin',
      'misconfigured',
      'demo_identity',
      'global_admin',
    ]);
  });
});
