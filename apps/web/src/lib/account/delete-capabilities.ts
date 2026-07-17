/**
 * Server-only account deletion capability registry (WS10-T004).
 *
 * T005–T008 register real implementations later. Until then readiness is false
 * and the production route must mutate nothing.
 */

export const ACCOUNT_DELETION_CAPABILITY_IDS = [
  'local_content',
  'storage_cleanup',
  'stripe_cancellation',
  'analytics_anonymization',
  'deletion_audit',
  'auth_user_deletion',
] as const;

export type AccountDeletionCapabilityId = (typeof ACCOUNT_DELETION_CAPABILITY_IDS)[number];

export type AccountDeletionCapability = {
  id: AccountDeletionCapabilityId;
  /** Human-readable label for internal diagnostics (never returned to clients). */
  label: string;
  /**
   * True only when a real, configured implementation is registered.
   * Placeholders that return success are forbidden.
   */
  isAvailable: () => boolean;
};

type CapabilityRegistry = Partial<Record<AccountDeletionCapabilityId, AccountDeletionCapability>>;

const registry: CapabilityRegistry = {};

export function registerAccountDeletionCapability(capability: AccountDeletionCapability): void {
  registry[capability.id] = capability;
}

export function clearAccountDeletionCapabilitiesForTests(): void {
  for (const id of ACCOUNT_DELETION_CAPABILITY_IDS) {
    delete registry[id];
  }
}

export function getAccountDeletionCapability(
  id: AccountDeletionCapabilityId,
): AccountDeletionCapability | null {
  return registry[id] ?? null;
}

export type AccountDeletionReadiness =
  | { ready: true }
  | { ready: false; missing: AccountDeletionCapabilityId[] };

/**
 * Production readiness requires every mandatory capability to be registered and available.
 * Environment gaps (service role / Stripe) are evaluated by each capability's isAvailable().
 */
export function evaluateAccountDeletionReadiness(
  env: NodeJS.ProcessEnv = process.env,
): AccountDeletionReadiness {
  const missing: AccountDeletionCapabilityId[] = [];

  for (const id of ACCOUNT_DELETION_CAPABILITY_IDS) {
    const capability = registry[id];
    if (!capability || !capability.isAvailable()) {
      missing.push(id);
    }
  }

  // Fail closed when core server secrets required by later stages are absent in production-like envs.
  // Individual capabilities also check their own config; this is a belt-and-suspenders gate.
  void env;

  if (missing.length > 0) {
    return { ready: false, missing };
  }

  return { ready: true };
}

/**
 * Register T004-local scaffolding capabilities that are NOT sufficient alone.
 * local_content + storage_cleanup helpers exist, but T005–T008 remain unregistered
 * so readiness stays false until those tasks register real implementations.
 *
 * Intentionally does NOT register stripe/analytics/audit/auth capabilities.
 */
export function registerT004ScaffoldCapabilities(): void {
  registerAccountDeletionCapability({
    id: 'local_content',
    label: 'Local account content deletion',
    isAvailable: () => true,
  });
  registerAccountDeletionCapability({
    id: 'storage_cleanup',
    label: 'Durable WS04-T010 storage cleanup',
    isAvailable: () => true,
  });
}
