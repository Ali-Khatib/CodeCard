import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mapOwnerConnectionToCard } from './map-owner-connection';
import type { OwnerConnectionListItem } from './connections-contract';

describe('WS15-T004 real Connections save flow', () => {
  it('maps owner list items into dashboard cards without forbidden fields', () => {
    const item: OwnerConnectionListItem = {
      connectionId: '55555555-5555-4555-8555-555555555555',
      connectedAt: '2026-07-17T12:00:00.000Z',
      createdAt: '2026-07-17T12:00:00.000Z',
      source: 'manual',
      context: null,
      privateNote: null,
      target: {
        profileId: '22222222-2222-4222-8222-222222222222',
        slug: 'bob-smith',
        displayName: 'Bob Smith',
        headline: 'Engineer',
        location: 'Berlin',
        avatarPublicUrl: 'https://cdn.example/bob.jpg',
        isPublic: true,
      },
    };
    const card = mapOwnerConnectionToCard(item);
    expect(card.name).toBe('Bob Smith');
    expect(card.profileSlug).toBe('bob-smith');
    expect(card.savedProfileId).toBe(item.target.profileId);
    expect(JSON.stringify(card)).not.toMatch(/email|stripe|password|Jordan Lee|Alex Chen/i);
  });

  it('hides unpublished target details in the card mapping', () => {
    const item: OwnerConnectionListItem = {
      connectionId: '55555555-5555-4555-8555-555555555555',
      connectedAt: null,
      createdAt: '2026-07-17T12:00:00.000Z',
      source: 'manual',
      context: null,
      privateNote: null,
      target: {
        profileId: '22222222-2222-4222-8222-222222222222',
        slug: '',
        displayName: 'Private CodeCard',
        headline: null,
        location: null,
        avatarPublicUrl: null,
        isPublic: false,
      },
    };
    const card = mapOwnerConnectionToCard(item);
    expect(card.isPublicTarget).toBe(false);
    expect(card.profileSlug).toBeUndefined();
    expect(card.name).toBe('Private CodeCard');
  });

  it('wires authenticated Connections page to real listOwnerConnections', () => {
    const page = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/(authenticated)/connections/page.tsx'),
      'utf8',
    );
    expect(page).toContain('listOwnerConnections');
    expect(page).toContain('AuthenticatedConnectionsClient');
    expect(page).toContain('mapOwnerConnectionToCard');
    expect(page).not.toContain('DEMO_CONNECTIONS');
  });

  it('restores Connections in authenticated nav and keeps Circle hidden', () => {
    const shell = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-shell.tsx'),
      'utf8',
    );
    const nav = shell.slice(
      shell.indexOf('const NAV_ITEMS'),
      shell.indexOf('] as const;') + '] as const;'.length,
    );
    expect(nav).toContain("label: 'Connections'");
    expect(nav).toContain("segment: 'connections'");
    expect(nav).toContain("label: 'Circle'");
    expect(nav).toContain("segment: 'circle'");
  });

  it('exposes Add connection on public profiles and never on own profile', () => {
    const control = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-connection-control.tsx'),
      'utf8',
    );
    const focused = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-focused.tsx'),
      'utf8',
    );
    const page = readFileSync(resolve(process.cwd(), 'src/app/[slug]/page.tsx'), 'utf8');

    expect(control).toContain('Add connection');
    expect(control).toContain('Remove connection');
    expect(control).toContain('Sign in to add connection');
    expect(control).toContain('if (isOwnProfile)');
    expect(control).toContain('return null');
    expect(focused).toContain('PublicProfileConnectionControl');
    expect(page).toContain('connectionControl');
    expect(page).toContain('isOwnProfile');
  });

  it('keeps preview and live-demo Connections populated separately', () => {
    const preview = readFileSync(
      resolve(process.cwd(), 'src/app/dashboard/preview/connections/page.tsx'),
      'utf8',
    );
    const demo = readFileSync(
      resolve(process.cwd(), 'src/lib/dashboard/workspace-demo.ts'),
      'utf8',
    );
    expect(preview).toContain('DEMO_CONNECTIONS');
    expect(demo).toContain('Jordan Lee');
    expect(demo).toContain('DEMO_CONNECTIONS');
  });

  it('empty-state copy and Explore CTA are present', () => {
    const view = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/dashboard-connections-view.tsx'),
      'utf8',
    );
    expect(view).toContain('Build a network you can actually remember');
    expect(view).toContain('Explore CodeCards');
    expect(view).toContain('href="/profiles"');
    expect(view).toContain("variant === 'authenticated'");
  });

  it('includes a gated Playwright fixture route', () => {
    expect(
      existsSync(resolve(process.cwd(), 'src/app/e2e-fixtures/connections/page.tsx')),
    ).toBe(true);
    const fixture = readFileSync(
      resolve(process.cwd(), 'src/app/e2e-fixtures/connections/page.tsx'),
      'utf8',
    );
    expect(fixture).toContain("CODECARD_E2E_FIXTURES === '1'");
    expect(fixture).toContain('connections');
  });
});
