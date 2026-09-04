import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canDisconnectGithub, GITHUB_OAUTH_SCOPES } from '@/lib/auth/github-oauth';
import { grantsProEntitlement } from '@/lib/billing/pro-price';
import { loadOwnerAnalytics } from '@/lib/dashboard/analytics-queries';
import {
  FORBIDDEN_PUBLIC_PROFILE_KEYS,
  PUBLIC_PROFILE_SELECT,
} from '@/lib/profile/public-profile';
import { resolveUploadOwnership } from '@/lib/storage/upload-ownership';

const WEB = resolve(process.cwd());
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PROJECT_B = '22222222-2222-4222-8222-222222222222';

function readWeb(rel: string) {
  return readFileSync(resolve(WEB, rel), 'utf8');
}

describe('cross-user authorization (session identity, not UI)', () => {
  it('public profile select cannot include private or billing fields', () => {
    expect(PUBLIC_PROFILE_SELECT).not.toMatch(/\*/);
    for (const key of FORBIDDEN_PUBLIC_PROFILE_KEYS) {
      expect(PUBLIC_PROFILE_SELECT).not.toContain(key);
    }
    expect(PUBLIC_PROFILE_SELECT).not.toMatch(/token|stripe|email|oauth/i);
    const loader = readWeb('src/lib/profile/public-profile.ts');
    expect(loader).toContain('PUBLIC_PROFILE_SELECT');
    expect(loader).not.toMatch(/from\('profiles'\)[\s\S]{0,80}select\('\*'/);
  });

  it('owner dashboard home does not select profiles.*', () => {
    const page = readWeb('src/app/dashboard/(authenticated)/page.tsx');
    expect(page).not.toContain(".select('*')");
    expect(page).toContain(".eq('owner_user_id', user!.id)");
  });

  it('project/research mutations bind owner_user_id from the session', () => {
    for (const file of [
      'src/lib/projects/project-update-core.ts',
      'src/lib/projects/project-delete-core.ts',
      'src/lib/research/research-update-core.ts',
      'src/lib/research/research-delete-core.ts',
    ]) {
      expect(readWeb(file)).toContain(".eq('owner_user_id'");
    }
  });

  it('GitHub disconnect is session unlinkIdentity and refuses the last identity', () => {
    expect(GITHUB_OAUTH_SCOPES).toBe('read:user user:email');
    expect(canDisconnectGithub([{ provider: 'github' }])).toBe(false);
    const action = readWeb('src/lib/auth/github-identity-actions.ts');
    expect(action).toContain('auth.getUser()');
    expect(action).toContain('canDisconnectGithub');
    expect(action).toContain('unlinkIdentity');
    expect(action).not.toMatch(/userId|targetUser/);
  });

  it('Pro entitlement ignores client price ids and inactive statuses', () => {
    const previous = process.env.STRIPE_PRO_PRICE_ID;
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_allowlisted';
    try {
      expect(grantsProEntitlement('active', 'price_attacker')).toBe(false);
      expect(grantsProEntitlement('canceled', 'price_pro_allowlisted')).toBe(false);
      expect(grantsProEntitlement('active', 'price_pro_allowlisted')).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.STRIPE_PRO_PRICE_ID;
      else process.env.STRIPE_PRO_PRICE_ID = previous;
    }
    const plan = readWeb('src/lib/projects/project-plan-core.ts');
    expect(plan).toContain('grantsProEntitlement');
    expect(plan).not.toMatch(/localStorage|searchParams/);
  });

  it('unauthenticated analytics and foreign upload ownership are denied', async () => {
    const analytics = await loadOwnerAnalytics({ from: vi.fn() } as never, null);
    expect(analytics).toEqual({ ok: false, reason: 'unauthenticated' });

    const supabase = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      })),
    };
    const upload = await resolveUploadOwnership(
      supabase as never,
      USER_A,
      'project-media',
      PROJECT_B,
    );
    expect(upload.ok).toBe(false);
    if (!upload.ok) expect(upload.status).toBe(403);
    expect(USER_A).not.toBe(USER_B);
  });
});
