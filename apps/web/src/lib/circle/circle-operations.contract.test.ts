import { describe, expect, it, vi } from 'vitest';
import {
  emitCircleActivity,
  emitProjectPublishedActivity,
} from './circle-emit-core';
import {
  projectContentFingerprint,
  projectHasMeaningfulChange,
  researchHasMeaningfulChange,
} from './circle-fingerprint';
import { listCircleFeed } from './circle-feed-core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function createInsertClient(result: { error: { code?: string; message?: string } | null }) {
  return {
    from: vi.fn(() => ({
      insert: vi.fn(async () => result),
    })),
  };
}

describe('WS16-T003 circle emit and feed operations', () => {
  it('emits publish events idempotently on unique violation', async () => {
    const okClient = createInsertClient({ error: null });
    const first = await emitProjectPublishedActivity(okClient as never, {
      tenantId: '11111111-1111-4111-8111-111111111111',
      actorProfileId: '22222222-2222-4222-8222-222222222222',
      projectId: '33333333-3333-4333-8333-333333333333',
    });
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.emitted).toBe(true);

    const dupClient = createInsertClient({ error: { code: '23505', message: 'duplicate' } });
    const second = await emitCircleActivity(dupClient as never, {
      tenantId: '11111111-1111-4111-8111-111111111111',
      actorProfileId: '22222222-2222-4222-8222-222222222222',
      eventType: 'project_published',
      targetId: '33333333-3333-4333-8333-333333333333',
    });
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.emitted).toBe(false);
  });

  it('rejects update emit without fingerprint', async () => {
    const client = createInsertClient({ error: null });
    const result = await emitCircleActivity(client as never, {
      tenantId: '11111111-1111-4111-8111-111111111111',
      actorProfileId: '22222222-2222-4222-8222-222222222222',
      eventType: 'project_updated',
      targetId: '33333333-3333-4333-8333-333333333333',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('INVALID_EVENT');
  });

  it('detects meaningful project and research changes and ignores no-ops', () => {
    const before = {
      title: 'Alpha',
      tagline: 'One',
      description: 'Desc',
      slug: 'alpha',
      technologies: ['ts'],
      status: 'published',
    };
    expect(projectHasMeaningfulChange(before, before)).toBe(false);
    expect(
      projectHasMeaningfulChange(before, { ...before, title: 'Beta' }),
    ).toBe(true);
    expect(projectContentFingerprint(before)).toBe(projectContentFingerprint({ ...before }));

    const researchBefore = {
      title: 'Paper',
      abstract: 'Abs',
      slug: 'paper',
      authors: ['A'],
      venue: 'Conf',
      publication_status: 'published',
      pdf_url: null,
      cover_image_url: null,
      year: 2026,
    };
    expect(researchHasMeaningfulChange(researchBefore, researchBefore)).toBe(false);
    expect(
      researchHasMeaningfulChange(researchBefore, { ...researchBefore, abstract: 'New' }),
    ).toBe(true);
  });

  it('returns unauthenticated and no_connections feed states safely', async () => {
    const unauth = {
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    };
    expect(await listCircleFeed(unauth as never)).toEqual({ status: 'unauthenticated' });

    const noConnections = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } },
          error: null,
        }),
      },
      from: (table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'saved_connections') {
          return {
            select: () => ({
              eq: async () => ({ data: [], error: null }),
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      },
    };
    expect(await listCircleFeed(noConnections as never)).toEqual({ status: 'no_connections' });
  });

  it('wires emit into publish/update cores and exposes feed action', () => {
    const projectPublish = readFileSync(
      resolve(process.cwd(), 'src/lib/projects/project-publish-core.ts'),
      'utf8',
    );
    const researchPublish = readFileSync(
      resolve(process.cwd(), 'src/lib/research/research-publish-core.ts'),
      'utf8',
    );
    const projectUpdate = readFileSync(
      resolve(process.cwd(), 'src/lib/projects/project-update-core.ts'),
      'utf8',
    );
    const researchUpdate = readFileSync(
      resolve(process.cwd(), 'src/lib/research/research-update-core.ts'),
      'utf8',
    );
    const action = readFileSync(resolve(process.cwd(), 'src/app/actions/circle.ts'), 'utf8');

    expect(projectPublish).toContain('emitProjectPublishedActivity');
    expect(researchPublish).toContain('emitResearchPublishedActivity');
    expect(projectUpdate).toContain('projectHasMeaningfulChange');
    expect(projectUpdate).toContain('emitProjectUpdatedActivity');
    expect(researchUpdate).toContain('researchHasMeaningfulChange');
    expect(researchUpdate).toContain('emitResearchUpdatedActivity');
    expect(action).toContain('listCircleFeed');
    expect(action).not.toContain('DEMO_CIRCLE_FEED');
  });

  it('keeps feed payloads free of private Connection fields', () => {
    const feed = readFileSync(resolve(process.cwd(), 'src/lib/circle/circle-feed-core.ts'), 'utf8');
    expect(feed).not.toContain('privateNote');
    expect(feed).not.toContain('connection_notes');
    expect(feed).not.toContain('collections');
    expect(feed).toContain('owner_user_id === user.id');
    expect(feed).toContain('is_published');
    expect(feed).toContain('is_public');
  });
});
