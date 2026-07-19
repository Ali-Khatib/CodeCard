import type { APIRequestContext, Page } from '@playwright/test';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  test,
  expect,
  signInViaUI,
  createAdminUser,
  type ProvisionedUser,
} from './support/auth.fixtures';

/**
 * WS14-T008 — analytics API integration coverage against the ISOLATED real
 * Supabase backend (never production).
 *
 * Every event in this suite is ingested through the REAL /api/analytics route
 * served by the isolated E2E web server — events are never inserted directly
 * into tables to fake ingestion. The privileged admin client is used only for
 * deterministic fixture setup, row verification and run-scoped cleanup.
 */

test.describe.configure({ mode: 'serial' });

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let owner: ProvisionedUser;
let foreign: ProvisionedUser;
let publishedProjectId: string;
let draftProjectId: string;
let publishedResearchId: string;
let draftResearchId: string;

function session(run: { runUuid: string }, label: string): string {
  // 8–64 chars, [A-Za-z0-9._-]: run-scoped so cleanup queries stay bounded.
  return `ws14t008-${run.runUuid.slice(0, 8)}-${label}`;
}

async function postEvent(
  ctx: APIRequestContext,
  body: unknown,
  opts: { userAgent?: string; contentType?: string } = {},
) {
  return ctx.post('/api/analytics', {
    data: body,
    headers: {
      'content-type': opts.contentType ?? 'application/json',
      'user-agent': opts.userAgent ?? BROWSER_UA,
    },
  });
}

/** Register every analytics_events row created under a run-scoped session ID. */
async function registerEventsBySession(
  admin: SupabaseClient,
  registry: { register: (kind: 'analytics_event', id: string, owner?: string) => unknown },
  sessionId: string,
): Promise<number> {
  const { data, error } = await admin
    .from('analytics_events')
    .select('id')
    .eq('session_id', sessionId);
  if (error) throw new Error(`session row lookup failed: ${error.code}`);
  for (const row of data ?? []) registry.register('analytics_event', row.id);
  return data?.length ?? 0;
}

async function countEventsBySession(admin: SupabaseClient, sessionId: string): Promise<number> {
  const { count, error } = await admin
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);
  if (error) throw new Error(`session count failed: ${error.code}`);
  return count ?? 0;
}

test.describe('WS14-T008 analytics API integration (isolated real backend)', () => {
  test('provision disposable published content', async ({ admin, env, run, registry }) => {
    owner = await createAdminUser(admin, env, registry, {
      slug: `ws14-t008-${run.runUuid.slice(0, 8)}`,
      displayName: 'WS14 T008 Owner',
      workerIndex: 80,
    });
    foreign = await createAdminUser(admin, env, registry, {
      slug: `ws14-t008f-${run.runUuid.slice(0, 8)}`,
      displayName: 'WS14 T008 Foreign',
      workerIndex: 81,
    });

    // Deterministic fixture setup (admin): publish the owner profile and seed
    // published/draft content that the real analytics API will attribute to.
    const { error: pubErr } = await admin
      .from('profiles')
      .update({ is_public: true })
      .eq('id', owner.profileId);
    expect(pubErr).toBeNull();

    const { data: pubProject, error: p1 } = await admin
      .from('projects')
      .insert({
        tenant_id: owner.tenantId,
        profile_id: owner.profileId,
        owner_user_id: owner.id,
        title: 'WS14 T008 Published Project',
        is_published: true,
      })
      .select('id')
      .single();
    expect(p1).toBeNull();
    publishedProjectId = pubProject!.id;
    registry.register('project', publishedProjectId, owner.id);

    const { data: draftProject, error: p2 } = await admin
      .from('projects')
      .insert({
        tenant_id: owner.tenantId,
        profile_id: owner.profileId,
        owner_user_id: owner.id,
        title: 'WS14 T008 Draft Project',
        is_published: false,
      })
      .select('id')
      .single();
    expect(p2).toBeNull();
    draftProjectId = draftProject!.id;
    registry.register('project', draftProjectId, owner.id);

    const { data: pubPaper, error: r1 } = await admin
      .from('research_papers')
      .insert({
        tenant_id: owner.tenantId,
        profile_id: owner.profileId,
        owner_user_id: owner.id,
        slug: `ws14-t008-paper-${run.runUuid.slice(0, 8)}`,
        title: 'WS14 T008 Published Paper',
        authors: ['WS14 T008 Owner'],
        is_published: true,
      })
      .select('id')
      .single();
    expect(r1).toBeNull();
    publishedResearchId = pubPaper!.id;
    registry.register('research_paper', publishedResearchId, owner.id);

    const { data: draftPaper, error: r2 } = await admin
      .from('research_papers')
      .insert({
        tenant_id: owner.tenantId,
        profile_id: owner.profileId,
        owner_user_id: owner.id,
        slug: `ws14-t008-draft-${run.runUuid.slice(0, 8)}`,
        title: 'WS14 T008 Draft Paper',
        authors: ['WS14 T008 Owner'],
        is_published: false,
      })
      .select('id')
      .single();
    expect(r2).toBeNull();
    draftResearchId = draftPaper!.id;
    registry.register('research_paper', draftResearchId, owner.id);
  });

  test('anonymous published profile view is recorded (analytics + profile events)', async ({
    request,
    admin,
    run,
    registry,
  }) => {
    const s = session(run, 'pview');
    const res = await postEvent(request, {
      event_type: 'profile_view',
      profile_id: owner.profileId,
      session_id: s,
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe('recorded');

    await expect.poll(() => countEventsBySession(admin, s), { timeout: 15_000 }).toBe(1);
    await registerEventsBySession(admin, registry, s);

    const { data: ppe } = await admin
      .from('public_profile_events')
      .select('id, referrer')
      .eq('profile_id', owner.profileId)
      .eq('session_id', s);
    expect(ppe?.length).toBe(1);
    // Referrer is never persisted for public profile events.
    expect(ppe![0].referrer).toBeNull();
  });

  test('QR source attribution is allowlisted; invalid source is rejected', async ({
    request,
    admin,
    run,
    registry,
  }) => {
    const s = session(run, 'qr');
    const res = await postEvent(request, {
      event_type: 'profile_view',
      profile_id: owner.profileId,
      session_id: s,
      source: 'qr',
    });
    expect(res.status()).toBe(200);
    await registerEventsBySession(admin, registry, s);

    const { data: rows } = await admin
      .from('public_profile_events')
      .select('source')
      .eq('profile_id', owner.profileId)
      .eq('session_id', s);
    expect(rows?.length).toBe(1);
    expect(rows![0].source).toBe('qr');

    const bad = await postEvent(request, {
      event_type: 'profile_view',
      profile_id: owner.profileId,
      session_id: session(run, 'badsrc'),
      source: 'search-engine-spam',
    });
    expect(bad.status()).toBe(422);
  });

  test('published project view records; draft project view is rejected', async ({
    request,
    admin,
    run,
    registry,
  }) => {
    const s = session(run, 'projview');
    const ok = await postEvent(request, {
      event_type: 'project_view',
      project_id: publishedProjectId,
      profile_id: owner.profileId,
      session_id: s,
    });
    expect(ok.status()).toBe(200);
    expect((await ok.json()).status).toBe('recorded');
    await expect.poll(() => countEventsBySession(admin, s), { timeout: 15_000 }).toBe(1);
    await registerEventsBySession(admin, registry, s);

    const { data: pve } = await admin
      .from('project_view_events')
      .select('id')
      .eq('project_id', publishedProjectId)
      .eq('session_id', s);
    expect(pve?.length).toBe(1);

    const sDraft = session(run, 'draftproj');
    const draft = await postEvent(request, {
      event_type: 'project_view',
      project_id: draftProjectId,
      profile_id: owner.profileId,
      session_id: sDraft,
    });
    expect(draft.status()).toBe(404);
    expect(await countEventsBySession(admin, sDraft)).toBe(0);
  });

  test('published research view and PDF download record; draft research is rejected', async ({
    request,
    admin,
    run,
    registry,
  }) => {
    const sView = session(run, 'resview');
    const view = await postEvent(request, {
      event_type: 'research_view',
      research_paper_id: publishedResearchId,
      profile_id: owner.profileId,
      session_id: sView,
    });
    expect(view.status()).toBe(200);
    await expect.poll(() => countEventsBySession(admin, sView), { timeout: 15_000 }).toBe(1);
    await registerEventsBySession(admin, registry, sView);

    const sDl = session(run, 'resdl');
    const download = await postEvent(request, {
      event_type: 'paper_download',
      research_paper_id: publishedResearchId,
      profile_id: owner.profileId,
      session_id: sDl,
    });
    expect(download.status()).toBe(200);
    await expect.poll(() => countEventsBySession(admin, sDl), { timeout: 15_000 }).toBe(1);
    await registerEventsBySession(admin, registry, sDl);

    const { data: dlRows } = await admin
      .from('analytics_events')
      .select('event_type, target_type, target_id')
      .eq('session_id', sDl);
    expect(dlRows![0]).toMatchObject({
      event_type: 'paper_download',
      target_type: 'research',
      target_id: publishedResearchId,
    });

    const sDraft = session(run, 'draftres');
    const draft = await postEvent(request, {
      event_type: 'research_view',
      research_paper_id: draftResearchId,
      profile_id: owner.profileId,
      session_id: sDraft,
    });
    expect(draft.status()).toBe(404);
    expect(await countEventsBySession(admin, sDraft)).toBe(0);
  });

  test('link clicks record allowlisted categories without persisting URLs', async ({
    request,
    admin,
    run,
    registry,
  }) => {
    const sProfile = session(run, 'ghclick');
    const github = await postEvent(request, {
      event_type: 'link_click',
      profile_id: owner.profileId,
      session_id: sProfile,
      metadata: {
        link_kind: 'profile',
        link_category: 'github',
        url: 'https://github.com/should-not-persist',
      },
    });
    expect(github.status()).toBe(200);
    expect((await github.json()).status).toBe('recorded');
    await registerEventsBySession(admin, registry, sProfile);

    const { data: ghRows } = await admin
      .from('analytics_events')
      .select('metadata, target_type')
      .eq('session_id', sProfile);
    expect(ghRows?.length).toBe(1);
    // Only category + kind are persisted — never destination URLs.
    expect(ghRows![0].metadata).toEqual({ link_category: 'github', link_kind: 'profile' });
    expect(ghRows![0].target_type).toBe('profile');

    const sProject = session(run, 'repoclick');
    const repo = await postEvent(request, {
      event_type: 'link_click',
      profile_id: owner.profileId,
      project_id: publishedProjectId,
      session_id: sProject,
      metadata: { link_kind: 'project', link_category: 'repo' },
    });
    expect(repo.status()).toBe(200);
    expect((await repo.json()).status).toBe('recorded');
    await registerEventsBySession(admin, registry, sProject);

    const invalid = await postEvent(request, {
      event_type: 'link_click',
      profile_id: owner.profileId,
      session_id: session(run, 'badcat'),
      metadata: { link_kind: 'profile', link_category: 'phishing' },
    });
    expect(invalid.status()).toBe(400);
  });

  test('time-spent checkpoints require valid integer durations', async ({
    request,
    admin,
    run,
    registry,
  }) => {
    const s = session(run, 'timespent');
    const ok = await postEvent(request, {
      event_type: 'time_spent_on_research',
      research_paper_id: publishedResearchId,
      profile_id: owner.profileId,
      session_id: s,
      metadata: { seconds: 42 },
    });
    expect(ok.status()).toBe(200);
    await expect.poll(() => countEventsBySession(admin, s), { timeout: 15_000 }).toBe(1);
    await registerEventsBySession(admin, registry, s);

    const { data: rows } = await admin
      .from('analytics_events')
      .select('metadata')
      .eq('session_id', s);
    expect(rows![0].metadata).toMatchObject({ seconds: 42 });

    for (const seconds of [2, 1801, 3.5, -1]) {
      const bad = await postEvent(request, {
        event_type: 'time_spent_on_research',
        research_paper_id: publishedResearchId,
        profile_id: owner.profileId,
        session_id: session(run, 'baddur'),
        metadata: { seconds },
      });
      expect(bad.status(), `seconds=${seconds} must be rejected`).toBe(400);
    }
    expect(await countEventsBySession(admin, session(run, 'baddur'))).toBe(0);
  });

  test('malformed, unknown, oversized and invalid-ID events are rejected', async ({
    request,
    admin,
    run,
  }) => {
    const unknownType = await postEvent(request, {
      event_type: 'totally_unknown_event',
      profile_id: owner.profileId,
      session_id: session(run, 'unk'),
    });
    expect(unknownType.status()).toBe(422);

    const badUuid = await postEvent(request, {
      event_type: 'profile_view',
      profile_id: 'not-a-uuid',
      session_id: session(run, 'baduuid'),
    });
    expect(badUuid.status()).toBe(422);

    const wrongContentType = await postEvent(
      request,
      { event_type: 'profile_view', profile_id: owner.profileId },
      { contentType: 'text/plain' },
    );
    expect(wrongContentType.status()).toBe(415);

    // JSON body limit is 64 KB (BODY_LIMITS.json) — oversized must be 413.
    const oversized = await request.post('/api/analytics', {
      headers: { 'content-type': 'application/json', 'user-agent': BROWSER_UA },
      data: JSON.stringify({
        event_type: 'profile_view',
        profile_id: owner.profileId,
        metadata: { blob: 'x'.repeat(70 * 1024) },
      }),
    });
    expect(oversized.status()).toBe(413);

    // Valid UUID pointing at nothing public → 404, no row.
    const ghost = await postEvent(request, {
      event_type: 'profile_view',
      profile_id: '00000000-0000-4000-8000-000000000000',
      session_id: session(run, 'ghost'),
    });
    expect(ghost.status()).toBe(404);
    expect(await countEventsBySession(admin, session(run, 'ghost'))).toBe(0);
  });

  test('obvious bots are ignored and never recorded', async ({ request, admin, run }) => {
    const s = session(run, 'bot');
    const res = await postEvent(
      request,
      { event_type: 'profile_view', profile_id: owner.profileId, session_id: s },
      { userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
    );
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe('ignored');
    expect(await countEventsBySession(admin, s)).toBe(0);
  });

  test('metadata PII (user agent keys) is redacted before persistence', async ({
    request,
    admin,
    run,
    registry,
  }) => {
    const s = session(run, 'redact');
    const res = await postEvent(request, {
      event_type: 'research_view',
      research_paper_id: publishedResearchId,
      profile_id: owner.profileId,
      session_id: s,
      metadata: { user_agent: 'leak-me', userAgent: 'leak-me-too', ua: 'leak-3', marker: 'kept' },
    });
    expect(res.status()).toBe(200);
    await expect.poll(() => countEventsBySession(admin, s), { timeout: 15_000 }).toBe(1);
    await registerEventsBySession(admin, registry, s);

    const { data: rows } = await admin
      .from('analytics_events')
      .select('metadata')
      .eq('session_id', s);
    const metadata = rows![0].metadata as Record<string, unknown>;
    expect(metadata.marker).toBe('kept');
    expect(metadata).not.toHaveProperty('user_agent');
    expect(metadata).not.toHaveProperty('userAgent');
    expect(metadata).not.toHaveProperty('ua');
  });

  test('owner self-view is excluded; foreign authenticated view is included', async ({
    page,
    browser,
    admin,
    run,
    registry,
  }) => {
    // Owner signs in through the real UI; page.request shares the session cookies.
    await signInViaUI(page, { email: owner.email, password: owner.password });
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    const sOwner = session(run, 'ownerview');
    const ownerRes = await postEvent(page.request, {
      event_type: 'profile_view',
      profile_id: owner.profileId,
      session_id: sOwner,
    });
    expect(ownerRes.status()).toBe(200);
    expect((await ownerRes.json()).status).toBe('ignored');
    expect(await countEventsBySession(admin, sOwner)).toBe(0);

    // A different authenticated (non-owner) visitor is real audience.
    const foreignCtx = await browser.newContext();
    const foreignPage: Page = await foreignCtx.newPage();
    await signInViaUI(foreignPage, { email: foreign.email, password: foreign.password });
    await foreignPage.waitForURL(/\/dashboard/, { timeout: 30_000 });

    const sForeign = session(run, 'foreignview');
    const foreignRes = await postEvent(foreignPage.request, {
      event_type: 'profile_view',
      profile_id: owner.profileId,
      session_id: sForeign,
    });
    expect(foreignRes.status()).toBe(200);
    expect((await foreignRes.json()).status).toBe('recorded');
    await expect.poll(() => countEventsBySession(admin, sForeign), { timeout: 15_000 }).toBe(1);
    await registerEventsBySession(admin, registry, sForeign);
    await foreignCtx.close();
  });

  test('duplicate suppression holds where the session rows are resolvable (owner link_click)', async ({
    page,
    admin,
    run,
    registry,
  }) => {
    // Owner link_click both records (owner exclusion does not apply to clicks)
    // and remains readable by the same authenticated session, so the DB-backed
    // dedupe fallback can genuinely observe the first row. Each Playwright test
    // gets a fresh context, so sign in again here.
    await signInViaUI(page, { email: owner.email, password: owner.password });
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    const s = session(run, 'dup');
    const body = {
      event_type: 'link_click',
      profile_id: owner.profileId,
      session_id: s,
      metadata: { link_kind: 'profile', link_category: 'website' },
    };

    const first = await postEvent(page.request, body);
    expect(first.status()).toBe(200);
    expect((await first.json()).status).toBe('recorded');

    const second = await postEvent(page.request, body);
    expect(second.status()).toBe(200);
    expect((await second.json()).status).toBe('ignored');

    expect(await countEventsBySession(admin, s)).toBe(1);
    await registerEventsBySession(admin, registry, s);
  });

  test('anonymous duplicate suppression truthfully depends on Redis (documented degradation)', async ({
    request,
    admin,
    run,
    registry,
  }) => {
    // Without Upstash Redis (not configured in the isolated E2E environment),
    // the DB dedupe fallback runs as the anonymous role, which cannot SELECT
    // analytics_events under owner-only RLS. Anonymous duplicates are therefore
    // accepted here — this test documents that real, current behavior instead
    // of pretending Redis-backed dedupe was exercised. WS14-T016 provisions
    // Redis for production.
    const s = session(run, 'anondup');
    const body = { event_type: 'profile_view', profile_id: owner.profileId, session_id: s };

    const first = await postEvent(request, body);
    expect(first.status()).toBe(200);
    const second = await postEvent(request, body);
    expect(second.status()).toBe(200);

    const rows = await countEventsBySession(admin, s);
    expect(rows).toBeGreaterThanOrEqual(1);
    expect(rows).toBeLessThanOrEqual(2);
    await registerEventsBySession(admin, registry, s);
  });

  test('analytics reads are owner-only with cross-tenant denial and truthful empty state', async ({
    env,
    admin,
  }) => {
    const anonClient = createSupabaseClient(env.supabaseUrl, env.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Anonymous: zero rows despite recorded events existing (RLS owner-only SELECT).
    const anonRead = await anonClient
      .from('analytics_events')
      .select('id')
      .eq('profile_id', owner.profileId);
    expect(anonRead.data ?? []).toHaveLength(0);

    // Foreign authenticated user: cannot read another tenant's analytics.
    const foreignClient = createSupabaseClient(env.supabaseUrl, env.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const foreignAuth = await foreignClient.auth.signInWithPassword({
      email: foreign.email,
      password: env.testPassword,
    });
    expect(foreignAuth.error).toBeNull();
    const foreignRead = await foreignClient
      .from('analytics_events')
      .select('id')
      .eq('profile_id', owner.profileId);
    expect(foreignRead.data ?? []).toHaveLength(0);

    // Truthful empty state: the foreign user's own analytics are genuinely empty.
    const foreignOwn = await foreignClient
      .from('analytics_events')
      .select('id')
      .eq('profile_id', foreign.profileId);
    expect(foreignOwn.data ?? []).toHaveLength(0);
    await foreignClient.auth.signOut();

    // Owner: can read their own recorded events.
    const ownerClient = createSupabaseClient(env.supabaseUrl, env.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const ownerAuth = await ownerClient.auth.signInWithPassword({
      email: owner.email,
      password: env.testPassword,
    });
    expect(ownerAuth.error).toBeNull();
    const ownerRead = await ownerClient
      .from('analytics_events')
      .select('id, profile_id')
      .eq('profile_id', owner.profileId);
    expect((ownerRead.data ?? []).length).toBeGreaterThan(0);
    // Every readable row is scoped to the owner's own profile — no demo or
    // foreign contamination in the owner's real analytics read path.
    for (const row of ownerRead.data ?? []) {
      expect(row.profile_id).toBe(owner.profileId);
    }
    await ownerClient.auth.signOut();

    // Demo persona analytics never exist in real data: the demo identity is
    // preview-only sample data and is not seeded in the isolated project.
    const { data: demoProfiles } = await admin
      .from('profiles')
      .select('id')
      .eq('slug', 'alexchen');
    expect(demoProfiles ?? []).toHaveLength(0);
  });
});
