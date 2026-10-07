import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('QR scan handshake', () => {
  it('notifies the card owner and lets them add the scanner', () => {
    const core = read('src/lib/connections/scan-offers-core.ts');
    const actions = read('src/app/actions/scan-offers.ts');
    const ui = read('src/components/dashboard/inbound-scan-offers.tsx');
    const add = read('src/lib/connections/connections-core.ts');
    expect(core).toContain("SCAN_OFFERS_TABLE = 'connection_scan_offers'");
    expect(core).toContain('notifyCardOwnerOfScan');
    expect(core).toContain('executeAcceptScanOffer');
    expect(actions).toContain('acceptScanOfferAction');
    expect(ui).toContain('just scanned your card');
    expect(ui).toContain('Add connection');
    expect(add).toContain('notifyCardOwnerOfScan');
  });

  it('lets the scanner reopen an offer and the card owner read the scanner profile', () => {
    const sql = read('../../supabase/migrations/20260928140000_connection_scan_handshake_rls.sql');
    const mvpSql = read('../../supabase/migrations/20261007192600_mvp_scan_handshake_rls.sql');
    expect(sql).toContain('connection_scan_offers_scanner_select');
    expect(sql).toContain('connection_scan_offers_scanner_reopen');
    expect(sql).toContain("status = 'pending'");
    expect(sql).toContain('profiles_scan_handshake_select');
    expect(sql).toContain('saved_connections');
    expect(mvpSql).toContain('profiles_scan_handshake_select');
    expect(mvpSql).toContain('connection_scan_offers_scanner_reopen');
  });
});
