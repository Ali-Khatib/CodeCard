import 'server-only';

/**
 * Emergency server-side feature disable.
 *
 * Each switch is read from the environment on every call, so flipping a Vercel
 * environment variable and redeploying (or using an instant env change with a
 * restart) disables a feature without shipping code. Evaluation is server-only:
 * the flags are never sent to the browser and never gate on client state, so a
 * user cannot re-enable a feature by editing local state or replaying a request.
 *
 * These are blunt operational levers for incidents (abuse, cost runaway, a
 * broken downstream). They are not per-user entitlements — plan gating lives in
 * the billing/entitlement modules.
 */

/** Features that can be independently disabled. */
export const KILL_SWITCH_FEATURES = {
  /** Storage writes via /api/upload. */
  uploads: 'CODECARD_DISABLE_UPLOADS',
  /** Public analytics ingest. */
  analytics: 'CODECARD_DISABLE_ANALYTICS',
  /** Destructive account deletion pipeline. */
  accountDeletion: 'CODECARD_DISABLE_ACCOUNT_DELETION',
  /** Data export bundle generation. */
  accountExport: 'CODECARD_DISABLE_ACCOUNT_EXPORT',
  /** Public moderation + DMCA intake. */
  publicReports: 'CODECARD_DISABLE_PUBLIC_REPORTS',
  /** New account signups (see caveat below). */
  signups: 'CODECARD_DISABLE_SIGNUPS',
} as const;

export type KillSwitchFeature = keyof typeof KILL_SWITCH_FEATURES;

/**
 * Only the variables these functions read. Narrower than `NodeJS.ProcessEnv`,
 * which Next.js augments to require `NODE_ENV` — irrelevant here and awkward to
 * satisfy when passing a small literal in tests.
 */
type KillSwitchEnv = Readonly<Record<string, string | undefined>>;

/**
 * Read-only, all-features-off-by-default. Only the exact string '1' enables a
 * switch, so a stray empty or 'false' value cannot accidentally disable a
 * feature in production.
 */
export function isFeatureDisabled(
  feature: KillSwitchFeature,
  env: KillSwitchEnv = process.env,
): boolean {
  return env[KILL_SWITCH_FEATURES[feature]] === '1';
}

/** Global read-only mode: disables every mutating feature at once. */
export function isMaintenanceMode(env: KillSwitchEnv = process.env): boolean {
  return env.CODECARD_MAINTENANCE_MODE === '1';
}

/**
 * Whether a feature should refuse work right now.
 * Maintenance mode implies every individual switch.
 */
export function isFeatureBlocked(
  feature: KillSwitchFeature,
  env: KillSwitchEnv = process.env,
): boolean {
  return isMaintenanceMode(env) || isFeatureDisabled(feature, env);
}

/**
 * Operator-facing message. Deliberately generic: it states that the feature is
 * paused without revealing which switch, who set it, or any configuration.
 */
export const FEATURE_DISABLED_MESSAGE =
  'This feature is temporarily unavailable while we perform maintenance. Please try again later.';

/** Names of every switch, for ops docs and tests. */
export function killSwitchEnvVarNames(): string[] {
  return [...Object.values(KILL_SWITCH_FEATURES), 'CODECARD_MAINTENANCE_MODE'];
}
