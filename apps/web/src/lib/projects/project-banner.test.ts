import { describe, expect, it } from 'vitest';
import { parseBannerHex, PROJECT_BANNER_PRESETS } from '@/lib/projects/project-banner';

describe('project banner colors', () => {
  it('parses hex colors and keeps the violet group-banner palette', () => {
    expect(parseBannerHex('#b092c4')).toEqual([176, 146, 196]);
    expect(parseBannerHex('#B092C4')).toEqual([176, 146, 196]);
    expect(parseBannerHex('not-a-color')).toBeNull();

    expect(PROJECT_BANNER_PRESETS.find((preset) => preset.id === 'violet')).toMatchObject({
      accent: '#b092c4',
      background: '#1a141c',
      backgroundBottom: '#0e0c10',
    });
  });
});
