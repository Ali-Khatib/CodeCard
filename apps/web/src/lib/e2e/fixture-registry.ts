/**
 * Canonical cleanup registry for disposable E2E resources.
 *
 * Fixtures are registered immediately after creation and cleaned in safe
 * dependency order. Cleanup only ever operates on explicitly registered
 * resource IDs scoped to the current run — never table-wide deletes, never
 * email-prefix-only matching.
 */

export type FixtureKind =
  | 'storage_object'
  | 'analytics_event'
  | 'notification'
  | 'circle_state'
  | 'collection_item'
  | 'collection'
  | 'connection_note'
  | 'connection'
  | 'research_link'
  | 'research_media'
  | 'research_paper'
  | 'project_link'
  | 'project_media'
  | 'project'
  | 'profile_link'
  | 'profile'
  | 'subscription'
  | 'billing_event'
  | 'auth_user'
  | 'tenant';

/**
 * Children before parents; auth users before their (tenant) containers so
 * FK cascades never race the explicit deletes.
 */
export const CLEANUP_ORDER: readonly FixtureKind[] = [
  'storage_object',
  'analytics_event',
  'notification',
  'circle_state',
  'collection_item',
  'collection',
  'connection_note',
  'connection',
  'research_link',
  'research_media',
  'research_paper',
  'project_link',
  'project_media',
  'project',
  'profile_link',
  'profile',
  'subscription',
  'billing_event',
  'auth_user',
  'tenant',
];

export type RegisteredFixture = {
  kind: FixtureKind;
  /** Row ID, auth user ID, or `bucket/path` for storage objects. */
  id: string;
  /** Disposable owner, for ownership verification before deletion. */
  ownerUserId?: string;
  runId: string;
};

/** Deleters must tolerate resources the tested product flow already removed. */
export type FixtureDeleter = (fixture: RegisteredFixture) => Promise<'deleted' | 'already_gone'>;

export type CleanupFailure = { fixture: RegisteredFixture; reason: string };

export class E2ECleanupError extends Error {
  constructor(public readonly failures: CleanupFailure[]) {
    super(
      `E2E cleanup failed for ${failures.length} fixture(s): ${failures
        .map((f) => `${f.fixture.kind}:${f.fixture.id} (${f.reason})`)
        .join('; ')}`,
    );
    this.name = 'E2ECleanupError';
  }
}

export class E2EFixtureRegistry {
  private fixtures: RegisteredFixture[] = [];

  constructor(public readonly runId: string) {}

  register(kind: FixtureKind, id: string, ownerUserId?: string): RegisteredFixture {
    const fixture: RegisteredFixture = { kind, id, ownerUserId, runId: this.runId };
    this.fixtures.push(fixture);
    return fixture;
  }

  get size(): number {
    return this.fixtures.length;
  }

  registered(kind?: FixtureKind): RegisteredFixture[] {
    return kind ? this.fixtures.filter((f) => f.kind === kind) : [...this.fixtures];
  }

  /**
   * Delete every registered fixture in CLEANUP_ORDER. Failures are collected
   * and reported together via E2ECleanupError — never silently ignored. A
   * registered fixture without a matching deleter is a failure (fail closed).
   * Fixtures whose run ID does not match this registry are never deleted.
   */
  async cleanup(
    deleters: Partial<Record<FixtureKind, FixtureDeleter>>,
  ): Promise<{ deleted: number; alreadyGone: number }> {
    const failures: CleanupFailure[] = [];
    let deleted = 0;
    let alreadyGone = 0;

    for (const kind of CLEANUP_ORDER) {
      for (const fixture of this.fixtures.filter((f) => f.kind === kind)) {
        if (fixture.runId !== this.runId) {
          failures.push({ fixture, reason: 'run ID mismatch — refusing to delete' });
          continue;
        }
        const deleter = deleters[kind];
        if (!deleter) {
          failures.push({ fixture, reason: 'no deleter provided for kind' });
          continue;
        }
        try {
          const outcome = await deleter(fixture);
          if (outcome === 'deleted') deleted += 1;
          else alreadyGone += 1;
        } catch (error) {
          failures.push({
            fixture,
            reason: error instanceof Error ? error.message : 'unknown cleanup error',
          });
        }
      }
    }

    if (failures.length > 0) {
      throw new E2ECleanupError(failures);
    }

    this.fixtures = [];
    return { deleted, alreadyGone };
  }
}
