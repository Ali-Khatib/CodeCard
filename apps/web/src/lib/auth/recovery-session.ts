/** Server-only app_metadata flag for password-recovery privilege. */
export const PASSWORD_RECOVERY_APP_METADATA_KEY = 'codecard_password_recovery' as const;

export function userHasPasswordRecoveryPrivilege(
  user: { app_metadata?: Record<string, unknown> | null } | null | undefined,
): boolean {
  return user?.app_metadata?.[PASSWORD_RECOVERY_APP_METADATA_KEY] === true;
}

/** Paths a recovery-privileged session may use before the password is changed. */
export function isRecoveryAllowedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/auth/confirmed') ||
    pathname.startsWith('/auth/mark-recovery') ||
    pathname.startsWith('/api/auth/complete-password-reset')
  );
}
