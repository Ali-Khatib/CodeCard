import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AI_OWNER_RESULT_PRO_MESSAGE, saveAiOwnerResult } from './save-ai-owner-result';

vi.mock('@/lib/profile/profile-auth-core', () => ({
  resolveOwnedProfile: vi.fn(),
}));

vi.mock('@/lib/projects/project-plan-core', () => ({
  resolveTenantPlanId: vi.fn(),
}));

import { resolveOwnedProfile } from '@/lib/profile/profile-auth-core';
import { resolveTenantPlanId } from '@/lib/projects/project-plan-core';

const USER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROFILE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const ROW = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const resolveOwnedProfileMock = vi.mocked(resolveOwnedProfile);
const resolveTenantPlanIdMock = vi.mocked(resolveTenantPlanId);

function client(steps: Array<{ data?: unknown; error?: unknown; count?: number | null }>) {
  const inserts: unknown[] = [];
  let step = 0;
  const from = vi.fn(() => {
    const result = steps[step] ?? steps[steps.length - 1] ?? { data: null, error: null };
    step += 1;
    const chain: Record<string, unknown> = {};
    const self = new Proxy(chain, {
      get(target, prop) {
        if (prop === 'then') {
          return (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
        }
        if (prop in target) return target[prop as string];
        const fn = vi.fn((...args: unknown[]) => {
          if (prop === 'insert') inserts.push(args[0]);
          return self;
        });
        target[prop as string] = fn;
        return fn;
      },
    });
    return self;
  });
  return { from, inserts };
}

describe('saveAiOwnerResult', () => {
  beforeEach(() => {
    resolveOwnedProfileMock.mockReset();
    resolveTenantPlanIdMock.mockReset();
    resolveOwnedProfileMock.mockResolvedValue({
      profile: {
        id: PROFILE,
        tenant_id: TENANT,
        owner_user_id: USER,
        slug: 'ada',
        is_public: true,
      },
    });
    resolveTenantPlanIdMock.mockResolvedValue('pro');
  });

  it('refuses a signed-out caller before any write', async () => {
    const service = client([]);
    const result = await saveAiOwnerResult(client([]).from as never, service as never, null, {
      kind: 'project_draft',
      title: 'Draft',
      body: { summary: 'Hello' },
    });
    expect(result).toEqual({
      ok: false,
      code: 'UNAUTHENTICATED',
      error: 'You must be signed in.',
    });
    expect(service.from).not.toHaveBeenCalled();
  });

  it('refuses a Free plan and does not insert', async () => {
    resolveTenantPlanIdMock.mockResolvedValue('free');
    const service = client([]);
    const result = await saveAiOwnerResult({} as never, service as never, USER, {
      kind: 'analytics_review',
      title: 'Week of Oct 22',
      body: { summary: 'Steady visits' },
    });
    expect(result).toEqual({
      ok: false,
      code: 'NOT_PRO',
      error: AI_OWNER_RESULT_PRO_MESSAGE,
    });
    expect(service.from).not.toHaveBeenCalled();
    expect(resolveTenantPlanIdMock).toHaveBeenCalledWith(expect.anything(), TENANT);
  });

  it('inserts a Pro owner row using the profile tenant, not client fields', async () => {
    const service = client([{ count: 0, error: null }, { data: { id: ROW }, error: null }]);
    const result = await saveAiOwnerResult({} as never, service as never, USER, {
      kind: 'project_draft',
      title: '  Eagle Eye draft  ',
      body: { summary: 'Detects small objects' },
    });
    expect(result).toEqual({ ok: true, id: ROW });
    expect(service.inserts).toEqual([
      {
        tenant_id: TENANT,
        owner_user_id: USER,
        kind: 'project_draft',
        title: 'Eagle Eye draft',
        body: { summary: 'Detects small objects' },
      },
    ]);
  });

  it('stops at the saved-result cap', async () => {
    const service = client([{ count: 24, error: null }]);
    const result = await saveAiOwnerResult({} as never, service as never, USER, {
      kind: 'analytics_review',
      title: 'Another review',
      body: { summary: 'More' },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('LIMIT_REACHED');
    expect(service.inserts).toEqual([]);
  });
});

describe('ai_owner_results migration', () => {
  const sql = readFileSync(
    resolve(process.cwd(), '../../supabase/migrations/20261022160000_ai_owner_results.sql'),
    'utf8',
  );

  it('keeps the table owner-private and closed to client writes', () => {
    expect(sql).toContain('CREATE TABLE public.ai_owner_results');
    expect(sql).toContain("kind IN ('project_draft', 'analytics_review')");
    expect(sql).toContain('ALTER TABLE public.ai_owner_results ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.ai_owner_results FORCE ROW LEVEL SECURITY');
    expect(sql).toContain('REVOKE ALL ON TABLE public.ai_owner_results FROM anon, authenticated');
    expect(sql).toContain('GRANT SELECT, DELETE ON TABLE public.ai_owner_results TO authenticated');
    expect(sql).not.toContain('GRANT INSERT');
    expect(sql).toContain('ai_owner_results_owner_select');
    expect(sql).toContain('owner_user_id = auth.uid()');
    expect(sql).not.toMatch(/user_metadata/);
  });
});
