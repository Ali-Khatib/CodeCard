import type { APIRequestContext, Page } from '@playwright/test';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  test,
  expect,
  signInViaUI,
  createAdminUser,
  type ProvisionedUser,
} from './support/auth.fixtures';
import { E2E_BASE_URL } from './support/isolated-e2e';

/**
 * WS14-T009 — upload API integration coverage against the ISOLATED real
 * Supabase backend (never production).
 *
 * Exercises the real signed-upload architecture end to end: POST /api/upload
 * authorization, real byte PUTs to Supabase Storage, storage.objects RLS,
 * replacement cleanup through the real UI finalize path, and secure download
 * behavior. Only safe generated image/PDF fixture bytes are uploaded. The
 * admin client is used solely for fixture setup, verification and cleanup.
 */

test.describe.configure({ mode: 'serial' });

// 1x1 transparent PNG and 1x1 red PNG — valid magic bytes, safe fixtures.
const PNG_A_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PNG_B_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
// Minimal valid-magic PDF bytes (safe generated fixture, no real document).
const PDF_FIXTURE = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n',
  'utf8',
);

let owner: ProvisionedUser;
let foreign: ProvisionedUser;
let ownerProjectId: string;
let foreignProjectId: string;
let ownerPaperId: string;
let foreignPaperId: string;

type UploadInit = {
  path: string;
  signedUrl: string;
  token: string;
  mimeType: string;
  maxBytes: number;
};

async function postUpload(
  ctx: APIRequestContext,
  body: unknown,
  opts: { origin?: string } = {},
) {
  return ctx.post('/api/upload', {
    data: body,
    headers: {
      'content-type': 'application/json',
      origin: opts.origin ?? E2E_BASE_URL,
      'sec-fetch-site': opts.origin ? 'cross-site' : 'same-origin',
    },
  });
}

async function signInOwner(page: Page): Promise<void> {
  await signInViaUI(page, { email: owner.email, password: owner.password });
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

function userClient(env: { supabaseUrl: string; publishableKey: string }): SupabaseClient {
  return createSupabaseClient(env.supabaseUrl, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

test.describe('WS14-T009 upload API integration (isolated real backend)', () => {
  test('provision disposable owners with projects and research papers', async ({
    admin,
    env,
    run,
    registry,
  }) => {
    owner = await createAdminUser(admin, env, registry, {
      slug: `ws14-t009-${run.runUuid.slice(0, 8)}`,
      displayName: 'WS14 T009 Owner',
      workerIndex: 90,
    });
    foreign = await createAdminUser(admin, env, registry, {
      slug: `ws14-t009f-${run.runUuid.slice(0, 8)}`,
      displayName: 'WS14 T009 Foreign',
      workerIndex: 91,
    });

    for (const [user, label] of [
      [owner, 'Owner'],
      [foreign, 'Foreign'],
    ] as const) {
      const { data: project, error: pErr } = await admin
        .from('projects')
        .insert({
          tenant_id: user.tenantId,
          profile_id: user.profileId,
          owner_user_id: user.id,
          title: `WS14 T009 ${label} Project`,
          is_published: false,
        })
        .select('id')
        .single();
      expect(pErr).toBeNull();
      registry.register('project', project!.id, user.id);
      if (label === 'Owner') ownerProjectId = project!.id;
      else foreignProjectId = project!.id;

      const { data: paper, error: rErr } = await admin
        .from('research_papers')
        .insert({
          tenant_id: user.tenantId,
          profile_id: user.profileId,
          owner_user_id: user.id,
          slug: `ws14-t009-${label.toLowerCase()}-${run.runUuid.slice(0, 8)}`,
          title: `WS14 T009 ${label} Paper`,
          authors: [`WS14 T009 ${label}`],
          is_published: false,
        })
        .select('id')
        .single();
      expect(rErr).toBeNull();
      registry.register('research_paper', paper!.id, user.id);
      if (label === 'Owner') ownerPaperId = paper!.id;
      else foreignPaperId = paper!.id;
    }
  });

  test('upload authorization requires a session and same-origin request', async ({ request }) => {
    const unauthenticated = await postUpload(request, {
      resourceType: 'avatar',
      filename: 'a.png',
      mimeType: 'image/png',
      size: 128,
    });
    expect(unauthenticated.status()).toBe(401);

    const crossOrigin = await postUpload(
      request,
      { resourceType: 'avatar', filename: 'a.png', mimeType: 'image/png', size: 128 },
      { origin: 'https://evil.example' },
    );
    expect(crossOrigin.status()).toBe(403);
  });

  test('avatar init issues a canonical server-derived path; invalid metadata is rejected', async ({
    page,
    admin,
  }) => {
    await signInOwner(page);

    const ok = await postUpload(page.request, {
      resourceType: 'avatar',
      filename: 'avatar.png',
      mimeType: 'image/png',
      size: 512,
    });
    expect(ok.status()).toBe(200);
    const init = (await ok.json()) as UploadInit;
    // Server-derived canonical path: {tenant}/{owner}/avatar/{profileId}/{uuid}.png
    expect(init.path).toMatch(
      new RegExp(`^${owner.tenantId}/${owner.id}/avatar/${owner.profileId}/[0-9a-f-]{36}\\.png$`),
    );
    expect(init.maxBytes).toBe(5 * 1024 * 1024);
    expect(init.signedUrl).not.toContain('gclteunkzorwaliwhatp');

    // A durable upload intent is recorded, not yet finalized.
    const { data: intent } = await admin
      .from('storage_upload_intents')
      .select('bucket, resource_type, owner_user_id, finalized_at')
      .eq('object_path', init.path)
      .single();
    expect(intent).toMatchObject({
      bucket: 'avatars',
      resource_type: 'avatar',
      owner_user_id: owner.id,
      finalized_at: null,
    });

    // Unsupported MIME (SVG is active content) → 415.
    const svg = await postUpload(page.request, {
      resourceType: 'avatar',
      filename: 'x.svg',
      mimeType: 'image/svg+xml',
      size: 128,
    });
    expect(svg.status()).toBe(415);

    // Oversized avatar (6 MB > 5 MB) → 413.
    const oversized = await postUpload(page.request, {
      resourceType: 'avatar',
      filename: 'big.png',
      mimeType: 'image/png',
      size: 6 * 1024 * 1024,
    });
    expect(oversized.status()).toBe(413);

    // MIME/extension mismatch → rejected.
    const mismatch = await postUpload(page.request, {
      resourceType: 'avatar',
      filename: 'sneaky.svg',
      mimeType: 'image/png',
      size: 128,
    });
    expect([400, 415]).toContain(mismatch.status());

    // Product-disabled private-doc uploads stay disabled.
    const privateDoc = await postUpload(page.request, {
      resourceType: 'private-doc',
      resourceId: ownerPaperId,
      filename: 'doc.pdf',
      mimeType: 'application/pdf',
      size: 1024,
    });
    expect(privateDoc.status()).toBe(403);
  });

  test('project media and research figure authorization enforce ownership', async ({ page }) => {
    await signInOwner(page);

    const poster = await postUpload(page.request, {
      resourceType: 'project-media',
      resourceId: ownerProjectId,
      mediaRole: 'poster',
      filename: 'poster.png',
      mimeType: 'image/png',
      size: 2048,
    });
    expect(poster.status()).toBe(200);
    const posterInit = (await poster.json()) as UploadInit;
    expect(posterInit.path).toMatch(
      new RegExp(`^${owner.tenantId}/${owner.id}/project-media/${ownerProjectId}/[0-9a-f-]{36}\\.png$`),
    );

    // Media role is mandatory for project media.
    const noRole = await postUpload(page.request, {
      resourceType: 'project-media',
      resourceId: ownerProjectId,
      filename: 'poster.png',
      mimeType: 'image/png',
      size: 2048,
    });
    expect(noRole.status()).toBe(400);

    // Foreign project → 403 (never issues a signed URL for another tenant).
    const foreignProject = await postUpload(page.request, {
      resourceType: 'project-media',
      resourceId: foreignProjectId,
      mediaRole: 'poster',
      filename: 'poster.png',
      mimeType: 'image/png',
      size: 2048,
    });
    expect(foreignProject.status()).toBe(403);

    const figure = await postUpload(page.request, {
      resourceType: 'research-figure',
      resourceId: ownerPaperId,
      filename: 'figure.png',
      mimeType: 'image/png',
      size: 2048,
    });
    expect(figure.status()).toBe(200);
    const figureInit = (await figure.json()) as UploadInit;
    expect(figureInit.path).toMatch(
      new RegExp(`^${owner.tenantId}/${owner.id}/research-figure/${ownerPaperId}/[0-9a-f-]{36}\\.png$`),
    );

    const foreignPaper = await postUpload(page.request, {
      resourceType: 'research-figure',
      resourceId: foreignPaperId,
      filename: 'figure.png',
      mimeType: 'image/png',
      size: 2048,
    });
    expect(foreignPaper.status()).toBe(403);
  });

  test('real bytes upload via the signed URL; unfinalized intent persists no reference', async ({
    page,
    admin,
    env,
    registry,
  }) => {
    await signInOwner(page);

    const initRes = await postUpload(page.request, {
      resourceType: 'avatar',
      filename: 'real.png',
      mimeType: 'image/png',
      size: Buffer.from(PNG_A_BASE64, 'base64').length,
    });
    expect(initRes.status()).toBe(200);
    const init = (await initRes.json()) as UploadInit;

    const client = userClient(env);
    const auth = await client.auth.signInWithPassword({
      email: owner.email,
      password: env.testPassword,
    });
    expect(auth.error).toBeNull();

    const bytes = Buffer.from(PNG_A_BASE64, 'base64');
    const { error: putErr } = await client.storage
      .from('avatars')
      .uploadToSignedUrl(init.path, init.token, bytes, { contentType: 'image/png' });
    expect(putErr).toBeNull();
    registry.register('storage_object', `avatars/${init.path}`, owner.id);

    // Stored object round-trips with intact PNG magic bytes.
    const { data: blob, error: dlErr } = await admin.storage.from('avatars').download(init.path);
    expect(dlErr).toBeNull();
    const stored = new Uint8Array(await blob!.arrayBuffer());
    expect(Array.from(stored.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);

    // The avatar was never finalized: profile keeps no reference and the
    // intent stays open for the reconciliation job.
    const { data: profileRow } = await admin
      .from('profiles')
      .select('avatar_url')
      .eq('id', owner.profileId)
      .single();
    expect(profileRow?.avatar_url ?? '').not.toContain(init.path);
    const { data: intent } = await admin
      .from('storage_upload_intents')
      .select('finalized_at')
      .eq('object_path', init.path)
      .single();
    expect(intent?.finalized_at).toBeNull();
    await client.auth.signOut();
  });

  test('direct storage writes cannot use foreign paths, arbitrary buckets or traversal', async ({
    env,
  }) => {
    const bytes = Buffer.from(PNG_A_BASE64, 'base64');
    const foreignClient = userClient(env);
    const auth = await foreignClient.auth.signInWithPassword({
      email: foreign.email,
      password: env.testPassword,
    });
    expect(auth.error).toBeNull();

    // Foreign user writing into the owner's canonical namespace → RLS rejects.
    const ownerPath = `${owner.tenantId}/${owner.id}/avatar/${owner.profileId}/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png`;
    const foreignWrite = await foreignClient.storage
      .from('avatars')
      .upload(ownerPath, bytes, { contentType: 'image/png' });
    expect(foreignWrite.error).toBeTruthy();

    // Non-canonical path in an allowed bucket → RLS rejects.
    const nonCanonical = await foreignClient.storage
      .from('avatars')
      .upload('evil.png', bytes, { contentType: 'image/png' });
    expect(nonCanonical.error).toBeTruthy();

    // Path traversal → rejected.
    const traversal = await foreignClient.storage
      .from('avatars')
      .upload(`${foreign.tenantId}/../${owner.id}/avatar/${owner.profileId}/x.png`, bytes, {
        contentType: 'image/png',
      });
    expect(traversal.error).toBeTruthy();

    // private-doc resource type is never writable by users (product-disabled).
    const privateDoc = await foreignClient.storage
      .from('private-docs')
      .upload(
        `${foreign.tenantId}/${foreign.id}/private-doc/${foreignPaperId}/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.pdf`,
        PDF_FIXTURE,
        { contentType: 'application/pdf' },
      );
    expect(privateDoc.error).toBeTruthy();
    await foreignClient.auth.signOut();
  });

  test('cross-tenant deletion and replacement are rejected by storage RLS', async ({
    admin,
    env,
  }) => {
    // The object uploaded in the signed-URL test must still exist.
    const { data: objects } = await admin.storage
      .from('avatars')
      .list(`${owner.tenantId}/${owner.id}/avatar/${owner.profileId}`);
    expect((objects ?? []).length).toBeGreaterThan(0);
    const target = `${owner.tenantId}/${owner.id}/avatar/${owner.profileId}/${objects![0].name}`;

    const foreignClient = userClient(env);
    await foreignClient.auth.signInWithPassword({
      email: foreign.email,
      password: env.testPassword,
    });

    // Foreign delete silently matches zero rows — object must survive.
    await foreignClient.storage.from('avatars').remove([target]);
    const { data: still, error: stillErr } = await admin.storage.from('avatars').download(target);
    expect(stillErr).toBeNull();
    expect(still).toBeTruthy();

    // Foreign overwrite (upsert) of the owner's object → rejected.
    const overwrite = await foreignClient.storage
      .from('avatars')
      .upload(target, Buffer.from(PNG_B_BASE64, 'base64'), {
        contentType: 'image/png',
        upsert: true,
      });
    expect(overwrite.error).toBeTruthy();
    await foreignClient.auth.signOut();
  });

  test('UI avatar finalize persists the reference and replacement cleans the old object', async ({
    page,
    admin,
    registry,
  }) => {
    await signInOwner(page);
    await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded' });
    const upload = page.getByTestId('avatar-upload');
    await expect(upload).toBeVisible({ timeout: 30_000 });

    // First upload (real signed-URL flow + real finalize server action).
    await upload.locator('input[type="file"]').setInputFiles({
      name: 'ws14-t009-a.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_A_BASE64, 'base64'),
    });
    await upload.getByRole('button', { name: /^Upload (photo|replacement)$/ }).click();
    await expect(upload.getByRole('status').filter({ hasText: /Avatar saved/ })).toBeVisible({
      timeout: 45_000,
    });

    const marker = '/storage/v1/object/public/';
    const readAvatarUrl = async (): Promise<string> => {
      const { data } = await admin
        .from('profiles')
        .select('avatar_url')
        .eq('id', owner.profileId)
        .single();
      const url = String(data?.avatar_url ?? '');
      expect(url).toContain(marker);
      return url;
    };
    const objectIdFromUrl = (url: string): string =>
      decodeURIComponent(url.slice(url.indexOf(marker) + marker.length).split('?')[0]);

    const firstUrl = await readAvatarUrl();
    const firstObject = objectIdFromUrl(firstUrl);
    registry.register('storage_object', firstObject, owner.id);

    // Public bucket: the finalized avatar is publicly readable at its stored URL.
    const publicRes = await page.request.get(firstUrl);
    expect(publicRes.status()).toBe(200);

    // Replacement upload — the previous object must be cleaned per policy.
    await upload.locator('input[type="file"]').setInputFiles({
      name: 'ws14-t009-b.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_B_BASE64, 'base64'),
    });
    await upload.getByRole('button', { name: /^Upload (photo|replacement)$/ }).click();
    await expect(upload.getByRole('status').filter({ hasText: /Avatar saved/ })).toBeVisible({
      timeout: 45_000,
    });

    const secondObject = objectIdFromUrl(await readAvatarUrl());
    expect(secondObject).not.toBe(firstObject);
    registry.register('storage_object', secondObject, owner.id);

    // Old object removed (replacement cleanup policy).
    const oldPath = firstObject.replace(/^avatars\//, '');
    await expect
      .poll(
        async () => {
          const { error } = await admin.storage.from('avatars').download(oldPath);
          return Boolean(error);
        },
        { timeout: 20_000 },
      )
      .toBe(true);
  });

  test('private docs are not publicly readable or enumerable', async ({
    admin,
    env,
    request,
    registry,
  }) => {
    // Plant a fixture PDF via admin (user uploads to private-docs are disabled).
    const path = `${owner.tenantId}/${owner.id}/private-doc/${ownerPaperId}/aaaaaaaa-bbbb-4ccc-8ddd-ffffffffffff.pdf`;
    const { error: plantErr } = await admin.storage
      .from('private-docs')
      .upload(path, PDF_FIXTURE, { contentType: 'application/pdf' });
    expect(plantErr).toBeNull();
    registry.register('storage_object', `private-docs/${path}`, owner.id);

    // Anonymous download → rejected.
    const anonClient = userClient(env);
    const anonDownload = await anonClient.storage.from('private-docs').download(path);
    expect(anonDownload.error).toBeTruthy();

    // No public URL: bucket is private.
    const publicUrl = `${env.supabaseUrl}/storage/v1/object/public/private-docs/${path}`;
    const publicRes = await request.get(publicUrl);
    expect(publicRes.status()).toBeGreaterThanOrEqual(400);

    // Anonymous enumeration finds nothing.
    const anonList = await anonClient.storage
      .from('private-docs')
      .list(`${owner.tenantId}/${owner.id}/private-doc/${ownerPaperId}`);
    expect(anonList.data ?? []).toHaveLength(0);

    // Foreign authenticated user also cannot read another owner's private doc.
    const foreignClient = userClient(env);
    await foreignClient.auth.signInWithPassword({
      email: foreign.email,
      password: env.testPassword,
    });
    const foreignDownload = await foreignClient.storage.from('private-docs').download(path);
    expect(foreignDownload.error).toBeTruthy();
    await foreignClient.auth.signOut();
  });

  test('public research PDF route rejects URL injection and unpublished papers', async ({
    request,
  }) => {
    const injected = await request.get(
      `/api/public/research/${ownerPaperId}/pdf?url=https://evil.example/x.pdf`,
    );
    expect(injected.status()).toBe(400);

    const unpublished = await request.get(`/api/public/research/${ownerPaperId}/pdf`);
    expect(unpublished.status()).toBe(404);
  });

  test('upload API errors are sanitized and rate limiting is truthfully fail-open here', async ({
    page,
  }) => {
    await signInOwner(page);

    const bad = await postUpload(page.request, {
      resourceType: 'project-media',
      resourceId: foreignProjectId,
      mediaRole: 'poster',
      filename: 'poster.png',
      mimeType: 'image/png',
      size: 2048,
    });
    expect(bad.status()).toBe(403);
    const body = await bad.json();
    expect(typeof body.error).toBe('string');
    // Never expose raw provider/database errors.
    expect(body.error).not.toMatch(/PGRST|postgres|supabase|violates|constraint/i);

    // Truthful rate-limit statement: the isolated E2E environment has no
    // Upstash Redis, and CODECARD_E2E=1 keeps strict endpoints fail-open so a
    // production build can run locally. A bounded burst therefore succeeds —
    // real Redis-backed 429 behavior is owned by WS14-T016 configuration and
    // covered at the unit level in upload route tests.
    for (let i = 0; i < 3; i += 1) {
      const res = await postUpload(page.request, {
        resourceType: 'avatar',
        filename: `burst-${i}.png`,
        mimeType: 'image/png',
        size: 128,
      });
      expect(res.status()).toBe(200);
    }
  });
});
