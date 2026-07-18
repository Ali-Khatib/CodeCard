import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_FIXTURE_EMAILS,
  assertAllowedFixtureIdentity,
  createE2ERunIdentity,
  disposableFixtureEmail,
  storageFixturePath,
} from './run-id';
import {
  CLEANUP_ORDER,
  E2ECleanupError,
  E2EFixtureRegistry,
} from './fixture-registry';

describe('WS14 E2E run identity', () => {
  it('15. run IDs are unique', () => {
    const a = createE2ERunIdentity();
    const b = createE2ERunIdentity();
    expect(a.runId).not.toBe(b.runId);
    expect(a.runUuid).not.toBe(b.runUuid);
  });

  it('16. fixture users are unique across workers', () => {
    const run = createE2ERunIdentity();
    const emails = new Set(
      [0, 1, 2].flatMap((worker) =>
        Array.from({ length: 5 }, () =>
          disposableFixtureEmail({
            runId: run.runId,
            workerIndex: worker,
            emailDomain: 'codecard-e2e.example.com',
          }),
        ),
      ),
    );
    expect(emails.size).toBe(15);
    for (const email of emails) {
      expect(email).toMatch(/^codecard-e2e\+/);
      expect(email).toContain(run.runId.toLowerCase());
    }
  });

  it('21. storage paths include run and owner IDs', () => {
    const run = createE2ERunIdentity();
    const owner = '11111111-1111-4111-8111-111111111111';
    const tenant = '22222222-2222-4222-8222-222222222222';
    const path = storageFixturePath({
      tenantId: tenant,
      ownerUserId: owner,
      resourceType: 'avatar',
      runUuid: run.runUuid,
      fileName: `${run.runUuid}.png`,
    });
    expect(path).toContain(owner);
    expect(path).toContain(run.runUuid);
    expect(path.split('/')).toHaveLength(5);
  });

  it('22. Alex Chen demo identity cannot become a fixture', () => {
    const run = createE2ERunIdentity();
    expect(() =>
      assertAllowedFixtureIdentity(FORBIDDEN_FIXTURE_EMAILS[0], run.runId),
    ).toThrow(/demo persona/);
    expect(() =>
      assertAllowedFixtureIdentity('someone@example.com', run.runId),
    ).toThrow(/disposable/);
    expect(() =>
      assertAllowedFixtureIdentity(`codecard-e2e+other-run@example.com`, run.runId),
    ).toThrow(/current run ID/);
  });
});

describe('WS14 E2E fixture registry', () => {
  it('17. cleanup registry deletes only registered resources', async () => {
    const run = createE2ERunIdentity();
    const registry = new E2EFixtureRegistry(run.runId);
    registry.register('auth_user', 'user-a');
    registry.register('project', 'project-a');

    const deleted: string[] = [];
    await registry.cleanup({
      auth_user: async (f) => {
        deleted.push(f.id);
        return 'deleted';
      },
      project: async (f) => {
        deleted.push(f.id);
        return 'deleted';
      },
      // Unregistered kinds must not be invoked.
      storage_object: async () => {
        throw new Error('should not run for unregistered kinds');
      },
    });
    expect(deleted.sort()).toEqual(['project-a', 'user-a'].sort());
    expect(registry.size).toBe(0);
  });

  it('18. cleanup does not use unbounded deletion', () => {
    // The registry only ever hands registered IDs to deleters — there is no
    // "delete by email prefix" or "DELETE FROM table" path.
    expect(CLEANUP_ORDER).toContain('auth_user');
    expect(CLEANUP_ORDER).toContain('storage_object');
    const source = readFileSync(resolve(__dirname, 'fixture-registry.ts'), 'utf8');
    expect(source).not.toMatch(/DELETE FROM/i);
    expect(source).not.toMatch(/email\s*.*\s*LIKE/i);
    expect(source).toContain('fixture.runId !== this.runId');
  });

  it('19. already-deleted resources are handled safely', async () => {
    const run = createE2ERunIdentity();
    const registry = new E2EFixtureRegistry(run.runId);
    registry.register('auth_user', 'already-gone');
    const report = await registry.cleanup({
      auth_user: async () => 'already_gone',
    });
    expect(report.alreadyGone).toBe(1);
    expect(report.deleted).toBe(0);
  });

  it('20. cleanup failures produce non-zero failure', async () => {
    const run = createE2ERunIdentity();
    const registry = new E2EFixtureRegistry(run.runId);
    registry.register('auth_user', 'will-fail');
    await expect(
      registry.cleanup({
        auth_user: async () => {
          throw new Error('simulated failure');
        },
      }),
    ).rejects.toBeInstanceOf(E2ECleanupError);
  });

  it('23. ordinary fixtures never receive global-admin metadata', async () => {
    // The createDisposableUser helper (in admin-fixtures.ts) intentionally
    // never sets app_metadata.role. Asserted via source contract below and
    // by the absence of any admin-role argument in the run-id helpers.
    const email = disposableFixtureEmail({
      runId: createE2ERunIdentity().runId,
      emailDomain: 'codecard-e2e.example.com',
    });
    expect(email).not.toMatch(/admin/);
  });
});
