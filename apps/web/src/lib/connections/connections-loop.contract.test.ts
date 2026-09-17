import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildQrProfileUrl, getPublicProfileLinkForClipboard } from '@/lib/sharing/qr';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('Connections in-person loop', () => {
  it('encodes QR to the public CodeCard with a source=qr marker, not the dashboard', () => {
    const env = {
      NEXT_PUBLIC_APP_URL: 'https://app.codecard.test/',
      NODE_ENV: 'test',
    } as NodeJS.ProcessEnv;
    const clipboard = getPublicProfileLinkForClipboard('ada', env);
    expect(clipboard).toBe('https://app.codecard.test/ada');
    expect(clipboard).not.toContain('/dashboard');
    expect(buildQrProfileUrl(clipboard!)).toBe('https://app.codecard.test/ada?source=qr');
  });

  it('gates persist on QR scan and uses saved_connections via addConnectionAction', () => {
    const control = read('src/components/profile/public-profile-connection-control.tsx');
    const actions = read('src/app/actions/connections.ts');
    const core = read('src/lib/connections/connections-core.ts');
    expect(control).toContain('fromQrScan');
    expect(control).toContain('addConnectionAction');
    expect(control).toContain("source: 'qr'");
    expect(control).toContain('Sign in to connect');
    expect(control).toContain('View in Connections');
    expect(actions).toContain('addConnectionAction');
    expect(core).toContain('CONNECTIONS_TABLE');
    expect(core).toContain('CONNECTION_CREATE_SOURCE');
  });

  it('lists saved people with Open CodeCard as the return path', () => {
    const view = read('src/components/dashboard/dashboard-connections-view.tsx');
    const page = read('src/app/dashboard/(authenticated)/connections/page.tsx');
    expect(page).toContain('listOwnerConnections');
    expect(view).toContain('Open CodeCard');
    expect(view).toContain('connectionCodeCardHref');
    expect(view).not.toContain('Copy email');
    expect(view).not.toContain('connectionEmail');
  });

  it('keeps Circle as the activity feed of Connections, not a second people list', () => {
    const circlePage = read('src/app/dashboard/(authenticated)/circle/page.tsx');
    const feed = read('src/lib/circle/circle-feed-core.ts');
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    expect(circlePage).toContain('listCircleFeed');
    expect(feed).toContain('Enforces Connections membership');
    expect(shell).toContain("label: 'Connections'");
    expect(shell).toContain("label: 'Circle'");
  });

  it('replaces decorative public QR with a scannable public CodeCard payload', () => {
    const hero = read('src/components/profile/public-profile-hero-actions.tsx');
    const save = read('src/components/profile/public-profile-save-card.tsx');
    const qr = read('src/components/profile/public-code-card-qr.tsx');
    expect(qr).toContain('generateProfileQrPreview');
    expect(hero).toContain('PublicCodeCardQr');
    expect(save).toContain('PublicCodeCardQr');
    expect(hero).not.toMatch(/grid-cols-5 grid-rows-5/);
    expect(save).not.toMatch(/grid-cols-5 grid-rows-5/);
  });
});
