import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS07-T007 share panel analytics wiring', () => {
  it('records profile_share and qr_download only after successful actions', () => {
    const hero = read('src/components/dashboard/profile-share-hero.tsx');
    const route = read('src/app/api/analytics/route.ts');
    const overview = read('src/components/dashboard/dashboard-overview-view.tsx');

    expect(hero).toContain('trackProfileShareEvent');
    expect(hero).toContain("trackProfileShareEvent(profileId, 'copy')");
    expect(hero).toContain("trackProfileShareEvent(profileId, 'native_share')");
    expect(hero).toContain('trackQrDownloadEvent(profileId)');
    expect(hero).toContain("result.status === 'shared'");
    expect(hero).toMatch(/Cancellation[\s\S]*no analytics/);
    expect(overview).toContain('profileId={profile?.id}');

    expect(route).toContain("event_type === 'profile_share'");
    expect(route).toContain("event_type === 'qr_download'");
    expect(route).toContain('owner_user_id');
    expect(route).toContain('ownedProfile.is_public');
  });

  it('does not block user actions on analytics failure patterns', () => {
    const helpers = read('src/lib/sharing/share-analytics.ts');
    expect(helpers).toContain('trackEvent');
    expect(helpers).toContain('Fire-and-forget');
  });
});
