import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('connection request corner flow', () => {
  it('ships the incoming-call card and connection host in the dashboard shell', () => {
    const card = read('src/components/ui/card-16.tsx');
    const avatar = read('src/components/ui/avatar.tsx');
    const host = read('src/components/dashboard/connection-request-host.tsx');
    const shell = read('src/components/dashboard/dashboard-shell.tsx');

    expect(avatar).toContain('@radix-ui/react-avatar');
    expect(card).toContain('IncomingCall');
    expect(card).toContain("mode === 'connection'");
    expect(host).toContain('connection request');
    expect(host).toContain('Do later');
    expect(host).toContain('acceptScanOfferAction');
    expect(host).toContain('updateConnectionMetadataAction');
    expect(shell).toContain('ConnectionRequestHost');
  });
});
