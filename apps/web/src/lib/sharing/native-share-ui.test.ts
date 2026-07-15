import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('WS07-T006 ProfileShareHero native share wiring', () => {
  it('hides native share when unsupported and never fakes a share sheet', () => {
    const hero = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/profile-share-hero.tsx'),
      'utf8',
    );

    expect(hero).toContain('isNativeShareSupported');
    expect(hero).toContain('nativeShareAvailable');
    expect(hero).toContain('Share profile');
    expect(hero).toContain('Sharing options opened');
    expect(hero).toContain('shareBusyRef');
    expect(hero).not.toContain('Shared successfully to');
    expect(hero).not.toContain('WhatsApp');
    expect(hero).not.toContain('?source=share');
  });
});
