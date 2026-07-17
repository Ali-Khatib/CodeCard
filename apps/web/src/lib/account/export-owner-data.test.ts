import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { User } from '@supabase/supabase-js';
import { buildAccountExportDocument } from './export-build';
import {
  ACCOUNT_EXPORT_SCHEMA_VERSION,
  FORBIDDEN_EXPORT_FIELD_NAMES,
  findForbiddenExportFields,
} from './export-schema';

const OWNER_A = '11111111-1111-4111-8111-111111111111';
const OWNER_B = '22222222-2222-4222-8222-222222222222';
const PROFILE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROFILE_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PROJECT_A1 = 'c1111111-1111-4111-8111-111111111111';
const PROJECT_A2 = 'c2222222-2222-4222-8222-222222222222';
const PROJECT_B = 'c3333333-3333-4333-8333-333333333333';
const PAPER_A1 = 'd1111111-1111-4111-8111-111111111111';
const PAPER_A2 = 'd2222222-2222-4222-8222-222222222222';
const PAPER_B = 'd3333333-3333-4333-8333-333333333333';
const LINK_A = 'e1111111-1111-4111-8111-111111111111';
const FIG_A = 'f1111111-1111-4111-8111-111111111111';
const MEDIA_A = 'a1111111-1111-4111-8111-111111111111';
const DOMAIN_A = 'a2111111-1111-4111-8111-111111111111';
const FOCUS_A = 'a3111111-1111-4111-8111-111111111111';
const PLINK_A = 'a4111111-1111-4111-8111-111111111111';
const ORDER_A = 'a5111111-1111-4111-8111-111111111111';
const CONN_A = 'a6111111-1111-4111-8111-111111111111';
const NOTE_A = 'a7111111-1111-4111-8111-111111111111';
const COLL_A = 'a8111111-1111-4111-8111-111111111111';
const CITEM_A = 'a9111111-1111-4111-8111-111111111111';
const REPORT_A = 'aa111111-1111-4111-8111-111111111111';

function mockUser(id: string, email: string): User {
  return {
    id,
    email,
    created_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: '2026-07-01T00:00:00.000Z',
    identities: [{ provider: 'email' }],
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
  } as User;
}

type TableResult = { data: unknown; error: unknown };

function createThenable(result: TableResult) {
  const chain: Record<string, unknown> = {};
  const self = new Proxy(chain, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, reject);
      }
      if (prop in target) return target[prop as string];
      const fn = vi.fn(() => self);
      target[prop as string] = fn;
      return fn;
    },
  });
  return self as {
    select: (...args: unknown[]) => unknown;
    eq: (...args: unknown[]) => unknown;
    in: (...args: unknown[]) => unknown;
    order: (...args: unknown[]) => unknown;
    limit: (...args: unknown[]) => unknown;
    maybeSingle: (...args: unknown[]) => unknown;
    gte: (...args: unknown[]) => unknown;
    lt: (...args: unknown[]) => unknown;
  };
}

function createOwnerDataset(ownerId: string) {
  const isA = ownerId === OWNER_A;
  const profileId = isA ? PROFILE_A : PROFILE_B;
  const marker = isA ? 'OWNER_A_MARKER' : 'OWNER_B_SECRET_MARKER';

  const profile = {
    id: profileId,
    slug: isA ? 'owner-a' : 'owner-b-secret',
    display_name: isA ? 'Owner A' : 'Owner B Secret',
    headline: isA ? 'Engineer' : 'B Headline Secret',
    bio: isA ? 'Bio A' : 'Bio B Secret',
    location: isA ? 'SF' : 'Secret City',
    skills: isA ? ['TypeScript'] : ['SecretSkill'],
    is_public: true,
    avatar_url: isA ? 'https://cdn.example.com/a.png' : 'https://cdn.example.com/b-secret.png',
    created_at: '2026-01-02T00:00:00.000Z',
    updated_at: '2026-01-03T00:00:00.000Z',
  };

  const projects = isA
    ? [
        {
          id: PROJECT_A1,
          slug: 'proj-one',
          title: `${marker} Project One`,
          tagline: 't1',
          description: 'd1',
          technologies: ['ts'],
          is_published: true,
          sort_order: 0,
          user_role: 'Lead',
          status: 'active',
          started_at: '2025-01-01',
          ended_at: null,
          case_study_sections: { problem: 'p' },
          created_at: '2026-01-04T00:00:00.000Z',
          updated_at: '2026-01-04T00:00:00.000Z',
        },
        {
          id: PROJECT_A2,
          slug: 'proj-two',
          title: `${marker} Project Two`,
          tagline: null,
          description: null,
          technologies: [],
          is_published: false,
          sort_order: 1,
          user_role: null,
          status: null,
          started_at: null,
          ended_at: null,
          case_study_sections: {},
          created_at: '2026-01-05T00:00:00.000Z',
          updated_at: '2026-01-05T00:00:00.000Z',
        },
      ]
    : [
        {
          id: PROJECT_B,
          slug: 'proj-b',
          title: `${marker} Project`,
          tagline: null,
          description: null,
          technologies: [],
          is_published: true,
          sort_order: 0,
          user_role: null,
          status: null,
          started_at: null,
          ended_at: null,
          case_study_sections: {},
          created_at: '2026-01-04T00:00:00.000Z',
          updated_at: '2026-01-04T00:00:00.000Z',
        },
      ];

  const papers = isA
    ? [
        {
          id: PAPER_A1,
          slug: 'paper-one',
          title: `${marker} Paper One`,
          abstract: 'abs',
          authors: ['A'],
          venue: 'Conf',
          publication_status: 'published',
          year: 2025,
          pdf_url: 'https://example.com/a.pdf',
          doi_url: null,
          citation_text: 'cite',
          tags: ['ml'],
          cover_image_url: 'https://cdn.example.com/cover-a.png',
          is_published: true,
          sort_order: 0,
          related_project_id: PROJECT_A1,
          created_at: '2026-01-06T00:00:00.000Z',
          updated_at: '2026-01-06T00:00:00.000Z',
        },
        {
          id: PAPER_A2,
          slug: 'paper-two',
          title: `${marker} Paper Two`,
          abstract: null,
          authors: [],
          venue: null,
          publication_status: null,
          year: null,
          pdf_url: null,
          doi_url: null,
          citation_text: null,
          tags: [],
          cover_image_url: null,
          is_published: false,
          sort_order: 1,
          related_project_id: null,
          created_at: '2026-01-07T00:00:00.000Z',
          updated_at: '2026-01-07T00:00:00.000Z',
        },
      ]
    : [
        {
          id: PAPER_B,
          slug: 'paper-b',
          title: `${marker} Paper`,
          abstract: null,
          authors: [],
          venue: null,
          publication_status: null,
          year: null,
          pdf_url: null,
          doi_url: null,
          citation_text: null,
          tags: [],
          cover_image_url: null,
          is_published: true,
          sort_order: 0,
          related_project_id: null,
          created_at: '2026-01-06T00:00:00.000Z',
          updated_at: '2026-01-06T00:00:00.000Z',
        },
      ];

  return {
    profile,
    projects,
    papers,
    profileLinks: isA
      ? [
          {
            id: LINK_A,
            type: 'github',
            label: 'GitHub',
            url: 'https://github.com/a',
            sort_order: 0,
            created_at: '2026-01-02T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
          {
            id: 'e2222222-2222-4222-8222-222222222222',
            type: 'website',
            label: null,
            url: 'https://a.example.com',
            sort_order: 1,
            created_at: '2026-01-02T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
        ]
      : [],
    domains: isA
      ? [
          {
            id: DOMAIN_A,
            project_id: PROJECT_A1,
            name: 'AI',
            created_at: '2026-01-04T00:00:00.000Z',
          },
        ]
      : [],
    focus: isA
      ? [
          {
            id: FOCUS_A,
            project_id: PROJECT_A1,
            name: 'NLP',
            created_at: '2026-01-04T00:00:00.000Z',
          },
        ]
      : [],
    projectLinks: isA
      ? [
          {
            id: PLINK_A,
            project_id: PROJECT_A1,
            type: 'github',
            label: 'Repo',
            url: 'https://github.com/a/proj',
            sort_order: 0,
            created_at: '2026-01-04T00:00:00.000Z',
            updated_at: '2026-01-04T00:00:00.000Z',
          },
        ]
      : [],
    media: isA
      ? [
          {
            id: MEDIA_A,
            project_id: PROJECT_A1,
            type: 'poster',
            mime_type: 'image/png',
            file_size: 1024,
            sort_order: 0,
            created_at: '2026-01-04T00:00:00.000Z',
            updated_at: '2026-01-04T00:00:00.000Z',
            storage_path: `${ownerId}/secret-path.png`,
          },
        ]
      : [],
    orderings: isA
      ? [
          {
            id: ORDER_A,
            project_id: PROJECT_A1,
            sort_order: 0,
            created_at: '2026-01-04T00:00:00.000Z',
          },
        ]
      : [],
    figures: isA
      ? [
          {
            id: FIG_A,
            research_paper_id: PAPER_A1,
            image_url: 'https://cdn.example.com/fig-a.png',
            caption: 'Figure 1',
            sort_order: 0,
            created_at: '2026-01-06T00:00:00.000Z',
            updated_at: '2026-01-06T00:00:00.000Z',
            storage_path: 'should-not-export',
          },
        ]
      : [],
    events: isA
      ? [
          {
            event_type: 'profile_view',
            target_id: profileId,
            target_type: 'profile',
            metadata: {},
            created_at: '2026-07-10T12:00:00.000Z',
            session_id: 'sess-should-not-export',
            ip_address: '1.2.3.4',
          },
          {
            event_type: 'project_view',
            target_id: PROJECT_A1,
            target_type: 'project',
            metadata: {},
            created_at: '2026-07-10T13:00:00.000Z',
          },
          {
            event_type: 'research_view',
            target_id: PAPER_A1,
            target_type: 'research',
            metadata: {},
            created_at: '2026-07-10T14:00:00.000Z',
          },
          {
            event_type: 'link_click',
            target_id: LINK_A,
            target_type: 'profile',
            metadata: {},
            created_at: '2026-07-10T15:00:00.000Z',
          },
          {
            event_type: 'profile_share',
            target_id: profileId,
            target_type: 'profile',
            metadata: {},
            created_at: '2026-07-10T16:00:00.000Z',
          },
          {
            event_type: 'qr_download',
            target_id: profileId,
            target_type: 'profile',
            metadata: {},
            created_at: '2026-07-10T17:00:00.000Z',
          },
        ]
      : [
          {
            event_type: 'profile_view',
            target_id: profileId,
            target_type: 'profile',
            metadata: {},
            created_at: '2026-07-10T12:00:00.000Z',
          },
        ],
    sources: isA ? [{ source: 'qr' }] : [{ source: 'direct_link' }],
    connections: isA
      ? [
          {
            id: CONN_A,
            saved_profile_id: PROFILE_B,
            connected_at: '2026-02-01T00:00:00.000Z',
            met_at: null,
            source: 'manual',
            created_at: '2026-02-01T00:00:00.000Z',
            updated_at: '2026-02-01T00:00:00.000Z',
          },
        ]
      : [],
    notes: isA
      ? [
          {
            id: NOTE_A,
            saved_connection_id: CONN_A,
            body: 'Met at conference',
            created_at: '2026-02-02T00:00:00.000Z',
            updated_at: '2026-02-02T00:00:00.000Z',
          },
        ]
      : [],
    collections: isA
      ? [
          {
            id: COLL_A,
            name: 'Favorites',
            description: null,
            created_at: '2026-02-03T00:00:00.000Z',
            updated_at: '2026-02-03T00:00:00.000Z',
          },
        ]
      : [],
    collectionItems: isA
      ? [
          {
            id: CITEM_A,
            collection_id: COLL_A,
            saved_connection_id: CONN_A,
            sort_order: 0,
            created_at: '2026-02-03T00:00:00.000Z',
          },
        ]
      : [],
    subscription: isA
      ? {
          status: 'active',
          current_period_start: '2026-06-01T00:00:00.000Z',
          current_period_end: '2026-07-01T00:00:00.000Z',
          cancel_at_period_end: false,
          created_at: '2026-06-01T00:00:00.000Z',
          updated_at: '2026-06-01T00:00:00.000Z',
          stripe_subscription_id: 'sub_secret',
          stripe_price_id: 'price_secret',
        }
      : {
          status: 'active',
          current_period_start: '2026-06-01T00:00:00.000Z',
          current_period_end: '2026-07-01T00:00:00.000Z',
          cancel_at_period_end: false,
          created_at: '2026-06-01T00:00:00.000Z',
          updated_at: '2026-06-01T00:00:00.000Z',
          stripe_subscription_id: 'sub_b_secret',
          stripe_price_id: 'price_b_secret',
        },
    reports: isA
      ? [
          {
            id: REPORT_A,
            target_type: 'profile',
            target_id: PROFILE_B,
            reason: 'spam',
            status: 'pending',
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
          },
        ]
      : [],
  };
}

function createScopedClient(ownerId: string) {
  const ds = createOwnerDataset(ownerId);
  const from = vi.fn((table: string) => {
    switch (table) {
      case 'profiles':
        return createThenable({ data: ds.profile, error: null });
      case 'profile_links':
        return createThenable({ data: ds.profileLinks, error: null });
      case 'projects':
        return createThenable({ data: ds.projects, error: null });
      case 'project_domains':
        return createThenable({ data: ds.domains, error: null });
      case 'project_focus_areas':
        return createThenable({ data: ds.focus, error: null });
      case 'project_links':
        return createThenable({ data: ds.projectLinks, error: null });
      case 'project_media_assets':
        return createThenable({
          data: ds.media.map(({ storage_path: _s, ...rest }) => rest),
          error: null,
        });
      case 'project_orderings':
        return createThenable({ data: ds.orderings, error: null });
      case 'research_papers':
        return createThenable({ data: ds.papers, error: null });
      case 'research_figures':
        return createThenable({
          data: ds.figures.map(({ storage_path: _s, ...rest }) => rest),
          error: null,
        });
      case 'analytics_events':
        return createThenable({
          data: ds.events.map(({ session_id: _s, ip_address: _i, ...rest }) => rest),
          error: null,
        });
      case 'public_profile_events':
        return createThenable({ data: ds.sources, error: null });
      case 'saved_connections':
        return createThenable({ data: ds.connections, error: null });
      case 'connection_notes':
        return createThenable({ data: ds.notes, error: null });
      case 'collections':
        return createThenable({ data: ds.collections, error: null });
      case 'collection_items':
        return createThenable({ data: ds.collectionItems, error: null });
      case 'subscriptions':
        return createThenable({
          data: {
            status: ds.subscription.status,
            current_period_start: ds.subscription.current_period_start,
            current_period_end: ds.subscription.current_period_end,
            cancel_at_period_end: ds.subscription.cancel_at_period_end,
            created_at: ds.subscription.created_at,
            updated_at: ds.subscription.updated_at,
          },
          error: null,
        });
      case 'moderation_reports':
        return createThenable({ data: ds.reports, error: null });
      case 'circle_activity':
        return createThenable({ data: [], error: null });
      case 'circle_viewer_state':
        return createThenable({ data: null, error: null });
      default:
        return createThenable({ data: [], error: null });
    }
  });
  return { from, dataset: ds };
}

describe('WS10-T002/T003 buildAccountExportDocument', () => {
  it('builds versioned export for authenticated owner without service role', async () => {
    const { from } = createScopedClient(OWNER_A);
    const result = await buildAccountExportDocument({ from } as never, mockUser(OWNER_A, 'owner-a@example.com'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.document.schema_version).toBe(ACCOUNT_EXPORT_SCHEMA_VERSION);
    expect(result.document.account.email).toBe('owner-a@example.com');
    expect(result.document.profile?.slug).toBe('owner-a');
    expect(result.document.profile_links).toHaveLength(2);
  });

  it('fails atomically when profile query errors', async () => {
    const from = vi.fn(() => createThenable({ data: null, error: { message: 'boom' } }));
    const result = await buildAccountExportDocument(
      { from } as never,
      mockUser(OWNER_A, 'owner-a@example.com'),
    );
    expect(result).toEqual({ ok: false, error: 'query_failed' });
  });

  it('exports empty sections when no profile exists', async () => {
    const from = vi.fn((table: string) => {
      if (table === 'profiles') return createThenable({ data: null, error: null });
      return createThenable({ data: [], error: null });
    });
    const result = await buildAccountExportDocument(
      { from } as never,
      mockUser(OWNER_A, 'empty@example.com'),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.profile).toBeNull();
    expect(result.document.profile_links).toEqual([]);
    expect(result.document.projects).toEqual([]);
    expect(result.document.research).toEqual([]);
    expect(result.document.analytics_summary).toBeNull();
  });
});

describe('WS10-T003 complete owner data export', () => {
  it('includes complete Owner A hierarchy and analytics without Owner B markers', async () => {
    const { from } = createScopedClient(OWNER_A);
    const result = await buildAccountExportDocument(
      { from } as never,
      mockUser(OWNER_A, 'owner-a@example.com'),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const doc = result.document;
    expect(doc.projects).toHaveLength(2);
    expect(doc.projects[0]?.domains).toHaveLength(1);
    expect(doc.projects[0]?.focus_areas).toHaveLength(1);
    expect(doc.projects[0]?.links).toHaveLength(1);
    expect(doc.projects[0]?.media).toHaveLength(1);
    expect(doc.projects[0]?.media[0]?.public_url).toBeNull();
    expect(doc.projects[0]?.ordering?.id).toBe(ORDER_A);
    expect(doc.projects[1]?.is_published).toBe(false);

    expect(doc.research).toHaveLength(2);
    expect(doc.research[0]?.figures).toHaveLength(1);
    expect(doc.research[0]?.related_project_id).toBe(PROJECT_A1);

    expect(doc.analytics_summary).not.toBeNull();
    expect(doc.analytics_summary?.totals.profileViews).toBeGreaterThan(0);
    expect(doc.analytics_summary?.totals.projectViews).toBeGreaterThan(0);
    expect(doc.analytics_summary?.totals.researchViews).toBeGreaterThan(0);
    expect(doc.analytics_summary?.trends_7d).not.toBeNull();
    expect(doc.analytics_summary?.trends_30d).not.toBeNull();

    expect(doc.additional_account_data.saved_connections).toHaveLength(1);
    expect(doc.additional_account_data.connection_notes).toHaveLength(1);
    expect(doc.additional_account_data.collections[0]?.items).toHaveLength(1);
    expect(doc.additional_account_data.subscription?.plan_label).toBe('Pro');
    expect(doc.additional_account_data.moderation_reports).toHaveLength(1);

    const serialized = JSON.stringify(doc);
    expect(serialized).not.toContain('OWNER_B_SECRET_MARKER');
    expect(serialized).not.toContain('owner-b@');
    expect(serialized).not.toContain('owner-b-secret');
    expect(serialized).not.toContain('sub_secret');
    expect(serialized).not.toContain('price_secret');
    expect(serialized).not.toContain('storage_path');
    expect(serialized).not.toContain('sess-should-not-export');
    expect(serialized).not.toContain('1.2.3.4');
    expect(serialized).not.toContain('createServiceClient');

    expect(findForbiddenExportFields(doc)).toEqual([]);
    for (const forbidden of FORBIDDEN_EXPORT_FIELD_NAMES) {
      expect(serialized).not.toContain(`"${forbidden}"`);
    }
  });

  it('isolates Owner B export from Owner A markers', async () => {
    const { from } = createScopedClient(OWNER_B);
    const result = await buildAccountExportDocument(
      { from } as never,
      mockUser(OWNER_B, 'owner-b@example.com'),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const serialized = JSON.stringify(result.document);
    expect(serialized).toContain('OWNER_B_SECRET_MARKER');
    expect(serialized).not.toContain('OWNER_A_MARKER');
    expect(serialized).not.toContain('owner-a@example.com');
    expect(result.document.account.user_id).toBe(OWNER_B);
    expect(result.document.profile?.id).toBe(PROFILE_B);
  });

  it('ignores client-spoofed owner fields by never reading them from the request body', () => {
    const route = readFileSync(resolve(process.cwd(), 'src/app/api/account/export/route.ts'), 'utf8');
    expect(route).not.toContain('owner_user_id');
    expect(route).not.toContain('profileId');
    expect(route).not.toContain('stripe_customer_id');
    expect(route).toContain('user.id !== ctx.userId');
  });
});
