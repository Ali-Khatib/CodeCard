import { describe, expect, it } from 'vitest';
import { parseBannerHex, PROJECT_BANNER_PRESETS, projectBannerDataUrl } from '@/lib/projects/project-banner';

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

  it('draws a preview banner with the name, eyebrow, and subtitle', () => {
    const preset = PROJECT_BANNER_PRESETS[0]!;
    const url = projectBannerDataUrl({
      eyebrow: 'Project',
      title: 'Context-Aware Emotion Recognition',
      subtitle: 'Group photos, read face by face',
      accent: preset.accent,
      background: preset.background,
      backgroundBottom: preset.backgroundBottom,
    });
    const svg = decodeURIComponent(url.replace('data:image/svg+xml,', ''));
    expect(svg).toContain('PROJECT');
    expect(svg).toContain('Context-Aware');
    expect(svg).toContain('Emotion Recognition');
    expect(svg).toContain('Group photos, read face by face');
    expect(svg).toContain('viewBox="0 0 1600 400"');
  });
});
