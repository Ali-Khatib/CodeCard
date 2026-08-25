/**
 * Structured security events for server-side controls.
 * Never include passwords, tokens, cookies, secrets, or raw emails.
 */
export const SECURITY_EVENTS = [
  'ADMIN_ACCESS_DENIED',
  'STRIPE_WEBHOOK_FAILED',
  'SESSION_REVOKED',
  /** Account deleted, but its personal tenant row survived — needs cleanup. */
  'ACCOUNT_TENANT_SHELL_RETAINED',
] as const;

export type SecurityEventName = (typeof SECURITY_EVENTS)[number];

const FORBIDDEN_DETAIL_KEYS = new Set([
  'authorization',
  'cookie',
  'email',
  'password',
  'token',
  'secret',
  'signature',
  'session',
  'service_role',
]);

export function logSecurityEvent(
  event: SecurityEventName,
  details: Record<string, string | number | boolean | null> = {},
): void {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(details)) {
    if (FORBIDDEN_DETAIL_KEYS.has(key.toLowerCase())) continue;
    safe[key] = value;
  }
  console.info('[security]', { event, ...safe });
}
