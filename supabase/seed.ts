/**
 * WS14-T020 — Deterministic, idempotent local development seed.
 *
 * Usage (deliberate):
 *   CODECARD_LOCAL_SEED=1 \
 *   CODECARD_LOCAL_SEED_PASSWORD=<local-only-password> \
 *   npm run db:seed
 *
 * Defaults to local Supabase (`http://127.0.0.1:54321`) via NEXT_PUBLIC_SUPABASE_URL
 * / SUPABASE_SERVICE_ROLE_KEY when CODECARD_LOCAL_SEED_* overrides are unset.
 *
 * Never targets production. Guard lives in ./seed-guard.ts.
 * Never uses the protected staging showcase slug.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  LOCAL_SEED_DISPLAY_NAME,
  LOCAL_SEED_EMAIL,
  LOCAL_SEED_SLUG,
  requireLocalSeedEnvironment,
  type ValidatedSeedEnv,
} from './seed-guard';

const PUBLISHED_PROJECT_TITLE = 'DevFlow';
const PUBLISHED_PROJECT_SLUG = 'devflow';
const DRAFT_PROJECT_TITLE = 'Draft Sandbox';
const DRAFT_PROJECT_SLUG = 'draft-sandbox';
const PUBLISHED_RESEARCH_SLUG = 'retrieval-evaluation-for-dev-tools';
const DRAFT_RESEARCH_SLUG = 'unpublished-notes';
const SAMPLE_COVER_IMAGE =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop';

type ProfileRow = {
  id: string;
  tenant_id: string;
  owner_user_id: string;
  slug: string;
};

function log(message: string) {
  // Never log passwords or service-role keys.
  console.log(`[db:seed] ${message}`);
}

async function waitForProfile(
  admin: SupabaseClient,
  userId: string,
  attempts = 20,
): Promise<ProfileRow> {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await admin
      .from('profiles')
      .select('id, tenant_id, owner_user_id, slug')
      .eq('owner_user_id', userId)
      .maybeSingle();
    if (error) {
      throw new Error(`profile_read_failed:${error.code ?? 'unknown'}`);
    }
    if (data) return data as ProfileRow;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('profile_provision_timeout');
}

async function ensureAuthUser(admin: SupabaseClient, env: ValidatedSeedEnv): Promise<string> {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (list.error) {
    throw new Error(`auth_list_failed:${list.error.code ?? 'unknown'}`);
  }
  const existing = list.data.users.find(
    (u) => u.email?.toLowerCase() === LOCAL_SEED_EMAIL.toLowerCase(),
  );
  if (existing) {
    // Keep password in sync for local sign-in without recreating the user.
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: env.password,
      email_confirm: true,
      user_metadata: {
        display_name: LOCAL_SEED_DISPLAY_NAME,
        slug: LOCAL_SEED_SLUG,
      },
    });
    if (error) {
      throw new Error(`auth_update_failed:${error.code ?? 'unknown'}`);
    }
    log(`reused auth user for ${LOCAL_SEED_EMAIL}`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: LOCAL_SEED_EMAIL,
    password: env.password,
    email_confirm: true,
    user_metadata: {
      display_name: LOCAL_SEED_DISPLAY_NAME,
      slug: LOCAL_SEED_SLUG,
    },
  });
  if (error || !data.user) {
    throw new Error(`auth_create_failed:${error?.code ?? 'unknown'}`);
  }
  log(`created auth user for ${LOCAL_SEED_EMAIL}`);
  return data.user.id;
}

async function upsertProfile(admin: SupabaseClient, profile: ProfileRow) {
  const { error } = await admin
    .from('profiles')
    .update({
      slug: LOCAL_SEED_SLUG,
      display_name: LOCAL_SEED_DISPLAY_NAME,
      headline: 'Full-stack engineer building developer tools',
      bio: 'Local development sample profile. I build products that help developers ship faster.',
      location: 'Localhost',
      skills: ['TypeScript', 'Next.js', 'Postgres'],
      is_public: true,
      avatar_url:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop',
    })
    .eq('id', profile.id);
  if (error) {
    throw new Error(`profile_update_failed:${error.code ?? 'unknown'}`);
  }
  log(`profile ready /${LOCAL_SEED_SLUG} (public)`);
}

async function upsertLink(
  admin: SupabaseClient,
  profile: ProfileRow,
  type: string,
  url: string,
  sortOrder: number,
) {
  const { data: existing } = await admin
    .from('profile_links')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('type', type)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin
      .from('profile_links')
      .update({ url, sort_order: sortOrder, label: type })
      .eq('id', existing.id);
    if (error) throw new Error(`link_update_failed:${error.code ?? 'unknown'}`);
    return;
  }

  const { error } = await admin.from('profile_links').insert({
    tenant_id: profile.tenant_id,
    profile_id: profile.id,
    type,
    label: type,
    url,
    sort_order: sortOrder,
  });
  if (error) throw new Error(`link_insert_failed:${error.code ?? 'unknown'}`);
}

async function upsertProject(
  admin: SupabaseClient,
  profile: ProfileRow,
  input: {
    title: string;
    slug: string;
    tagline: string;
    description: string;
    technologies: string[];
    is_published: boolean;
    sort_order: number;
  },
): Promise<string> {
  const { data: existing } = await admin
    .from('projects')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('slug', input.slug)
    .maybeSingle();

  const payload = {
    title: input.title,
    slug: input.slug,
    tagline: input.tagline,
    description: input.description,
    technologies: input.technologies,
    is_published: input.is_published,
    sort_order: input.sort_order,
    status: input.is_published ? 'published' : 'draft',
    case_study_sections: {},
    user_role: 'Builder',
  };

  if (existing?.id) {
    const { error } = await admin.from('projects').update(payload).eq('id', existing.id);
    if (error) throw new Error(`project_update_failed:${error.code ?? 'unknown'}`);
    return existing.id as string;
  }

  const { data, error } = await admin
    .from('projects')
    .insert({
      tenant_id: profile.tenant_id,
      profile_id: profile.id,
      owner_user_id: profile.owner_user_id,
      ...payload,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(`project_insert_failed:${error?.code ?? 'unknown'}`);
  return data.id as string;
}

async function upsertProjectLink(
  admin: SupabaseClient,
  profile: ProfileRow,
  projectId: string,
  type: 'live' | 'repo' | 'demo' | 'paper' | 'other',
  url: string,
  sortOrder: number,
) {
  const { data: existing } = await admin
    .from('project_links')
    .select('id')
    .eq('project_id', projectId)
    .eq('type', type)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin
      .from('project_links')
      .update({ url, sort_order: sortOrder, label: type })
      .eq('id', existing.id);
    if (error) throw new Error(`project_link_update_failed:${error.code ?? 'unknown'}`);
    return;
  }

  const { error } = await admin.from('project_links').insert({
    tenant_id: profile.tenant_id,
    project_id: projectId,
    type,
    label: type,
    url,
    sort_order: sortOrder,
  });
  if (error) throw new Error(`project_link_insert_failed:${error.code ?? 'unknown'}`);
}

async function upsertResearch(
  admin: SupabaseClient,
  profile: ProfileRow,
  input: {
    slug: string;
    title: string;
    abstract: string;
    authors: string[];
    is_published: boolean;
    sort_order: number;
    related_project_id: string | null;
    pdf_url?: string;
  },
) {
  const { data: existing } = await admin
    .from('research_papers')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('slug', input.slug)
    .maybeSingle();

  const payload = {
    title: input.title,
    abstract: input.abstract,
    authors: input.authors,
    venue: 'Preprint',
    publication_status: input.is_published ? 'Under review' : 'Draft',
    year: 2026,
    pdf_url: input.pdf_url ?? 'https://example.com/local-dev-research.pdf',
    doi_url: null as string | null,
    citation_text: `${LOCAL_SEED_DISPLAY_NAME} (2026). ${input.title}. Preprint.`,
    tags: ['Local', 'Seed'],
    cover_image_url: input.is_published ? SAMPLE_COVER_IMAGE : null,
    is_published: input.is_published,
    sort_order: input.sort_order,
    related_project_id: input.related_project_id,
  };

  if (existing?.id) {
    const { error } = await admin.from('research_papers').update(payload).eq('id', existing.id);
    if (error) throw new Error(`research_update_failed:${error.code ?? 'unknown'}`);
    return;
  }

  const { error } = await admin.from('research_papers').insert({
    tenant_id: profile.tenant_id,
    profile_id: profile.id,
    owner_user_id: profile.owner_user_id,
    slug: input.slug,
    ...payload,
  });
  if (error) throw new Error(`research_insert_failed:${error?.code ?? 'unknown'}`);
}

export async function runLocalSeed(source: NodeJS.ProcessEnv = process.env): Promise<{
  email: string;
  slug: string;
  target: 'local' | 'staging';
  userId: string;
  profileId: string;
}> {
  const env = requireLocalSeedEnvironment(source);
  log(`target=${env.target}`);

  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userId = await ensureAuthUser(admin, env);
  const profile = await waitForProfile(admin, userId);
  await upsertProfile(admin, profile);

  await upsertLink(admin, profile, 'github', 'https://github.com/example/codecard-local', 0);
  await upsertLink(admin, profile, 'website', 'https://example.com', 1);

  const publishedProjectId = await upsertProject(admin, profile, {
    title: PUBLISHED_PROJECT_TITLE,
    slug: PUBLISHED_PROJECT_SLUG,
    tagline: 'CI/CD pipelines that actually make sense',
    description: 'Published sample project for local dashboard and public profile checks.',
    technologies: ['TypeScript', 'Go', 'Postgres'],
    is_published: true,
    sort_order: 0,
  });
  await upsertProjectLink(
    admin,
    profile,
    publishedProjectId,
    'live',
    'https://example.com/devflow',
    0,
  );
  await upsertProjectLink(
    admin,
    profile,
    publishedProjectId,
    'repo',
    'https://github.com/example/devflow',
    1,
  );

  await upsertProject(admin, profile, {
    title: DRAFT_PROJECT_TITLE,
    slug: DRAFT_PROJECT_SLUG,
    tagline: 'Not visible on the public profile',
    description: 'Draft-only project used to verify publication boundaries.',
    technologies: ['TypeScript'],
    is_published: false,
    sort_order: 1,
  });

  await upsertResearch(admin, profile, {
    slug: PUBLISHED_RESEARCH_SLUG,
    title: 'Retrieval Evaluation for Developer Tooling Agents',
    abstract:
      'A local seed paper for verifying public research rendering and citation copy.',
    authors: [LOCAL_SEED_DISPLAY_NAME],
    is_published: true,
    sort_order: 0,
    related_project_id: publishedProjectId,
  });

  await upsertResearch(admin, profile, {
    slug: DRAFT_RESEARCH_SLUG,
    title: 'Unpublished Local Notes',
    abstract: 'Draft research that must remain private.',
    authors: [LOCAL_SEED_DISPLAY_NAME],
    is_published: false,
    sort_order: 1,
    related_project_id: null,
  });

  log('idempotent seed complete');
  log(`sign-in email: ${LOCAL_SEED_EMAIL}`);
  log(`public profile path: /${LOCAL_SEED_SLUG}`);
  log('password: (from CODECARD_LOCAL_SEED_PASSWORD — not printed)');

  return {
    email: LOCAL_SEED_EMAIL,
    slug: LOCAL_SEED_SLUG,
    target: env.target,
    userId,
    profileId: profile.id,
  };
}

async function main() {
  try {
    await runLocalSeed(process.env);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    console.error(`[db:seed] ${message}`);
    process.exitCode = 1;
  }
}

const isCliEntry =
  typeof process.argv[1] === 'string'
  && /[\\/]supabase[\\/]seed\.(ts|js|mts|cjs)$/.test(process.argv[1].replace(/\\/g, '/'));

if (isCliEntry) {
  void main();
}
