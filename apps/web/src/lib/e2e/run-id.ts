import { randomUUID } from 'node:crypto';

/**
 * Canonical E2E run identity.
 *
 * Every test run gets one run ID combining a timestamp and a random UUID.
 * All disposable resources (users, storage objects, rows) derive their
 * identity from the run ID so cleanup can always be scoped to the run.
 */

export type E2ERunIdentity = {
  /** Full run ID, e.g. `e2e-20260718T120000Z-1b9d6bcd-...`. */
  runId: string;
  /** ISO timestamp component. */
  createdAt: string;
  /** The UUID component; also used as the storage resource-id segment. */
  runUuid: string;
};

/** Identities that must never become fixtures (demo persona, real people, staging showcase). */
export const FORBIDDEN_FIXTURE_EMAILS = [
  'alex.chen@stripe.com',
  'showcase.alex-chen@codecard-staging.test',
] as const;
export const FORBIDDEN_FIXTURE_USERNAMES = ['alexchen', 'alex-chen'] as const;
/** Persistent staging showcase slug — never register for E2E cleanup. */
export const FORBIDDEN_FIXTURE_PROFILE_SLUGS = ['alex-chen'] as const;

export function createE2ERunIdentity(now: Date = new Date()): E2ERunIdentity {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const runUuid = randomUUID();
  return {
    runId: `e2e-${stamp}-${runUuid}`,
    createdAt: now.toISOString(),
    runUuid,
  };
}

/**
 * Disposable mailbox for one fixture user:
 * `codecard-e2e+{runId}-w{workerIndex}-{uuid8}@{domain}`.
 * Plus-addressing keeps the recognizable prefix while staying unique per
 * worker and per user within a run. The domain must be a reserved domain
 * validated by the environment guard.
 */
export function disposableFixtureEmail(options: {
  runId: string;
  workerIndex?: number;
  emailDomain: string;
}): string {
  const worker = options.workerIndex ?? 0;
  const unique = randomUUID().slice(0, 8);
  return `codecard-e2e+${options.runId}-w${worker}-${unique}@${options.emailDomain}`.toLowerCase();
}

/**
 * A fixture identity is allowed only when it is a disposable run-scoped
 * address. The demo persona, staging showcase, and anything without the
 * current run ID is rejected so cleanup can never touch data outside the run.
 */
export function assertAllowedFixtureIdentity(email: string, runId: string): void {
  const normalized = email.trim().toLowerCase();
  if ((FORBIDDEN_FIXTURE_EMAILS as readonly string[]).includes(normalized)) {
    throw new Error('E2E fixture identity rejected: demo persona emails are forbidden.');
  }
  if (!normalized.startsWith('codecard-e2e+')) {
    throw new Error('E2E fixture identity rejected: not a disposable codecard-e2e address.');
  }
  if (!normalized.includes(runId.toLowerCase())) {
    throw new Error('E2E fixture identity rejected: email does not carry the current run ID.');
  }
}

/** Refuse staging showcase / demo profile slugs as disposable fixture targets. */
export function assertAllowedFixtureProfileSlug(slug: string): void {
  const normalized = slug.trim().toLowerCase();
  if ((FORBIDDEN_FIXTURE_PROFILE_SLUGS as readonly string[]).includes(normalized)) {
    throw new Error('E2E fixture identity rejected: persistent showcase slug is forbidden.');
  }
  if ((FORBIDDEN_FIXTURE_USERNAMES as readonly string[]).includes(normalized)) {
    throw new Error('E2E fixture identity rejected: demo persona username is forbidden.');
  }
}

/**
 * Storage object path for a fixture upload, following the app's canonical
 * `{tenant_id}/{owner_user_id}/{resource_type}/{resource_id}/{filename}`
 * shape. The disposable owner's user ID is the owner segment and the run's
 * UUID component is the resource-id segment, so every fixture object path
 * carries both the run identity and the disposable owner identity.
 */
export function storageFixturePath(options: {
  tenantId: string;
  ownerUserId: string;
  resourceType: 'avatar' | 'project-media' | 'private-doc';
  runUuid: string;
  fileName: string;
}): string {
  return [
    options.tenantId,
    options.ownerUserId,
    options.resourceType,
    options.runUuid,
    options.fileName,
  ].join('/');
}
