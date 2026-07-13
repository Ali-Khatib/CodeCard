import { describe, expect, it } from 'vitest';
import { firstSafeProjectLink, toSafeProjectLinkItems } from './safe-project-link-url';

describe('safe project link URLs', () => {
  it('removes dangerous URLs from public link lists', () => {
    const links = toSafeProjectLinkItems([
      { type: 'repo', label: null, url: 'https://github.com/a/b' },
      { type: 'other', label: null, url: 'javascript:alert(1)' },
    ]);
    expect(links).toHaveLength(1);
    expect(links[0]?.url).toBe('https://github.com/a/b');
  });

  it('selects the first safe link for a type', () => {
    const link = firstSafeProjectLink(
      [
        { type: 'live', label: null, url: 'javascript:alert(1)' },
        { type: 'live', label: null, url: 'https://demo.example' },
      ],
      ['live', 'demo'],
    );
    expect(link?.url).toBe('https://demo.example');
  });
});
