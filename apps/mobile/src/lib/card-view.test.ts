import { describe, expect, it } from 'vitest';
import { buildOwnerCardPresentation } from './card-view';

const PROFILE = {
  slug: 'ada-lovelace',
  display_name: 'Ada Lovelace',
  headline: 'Analytical engine',
  avatar_url: 'https://cdn.example/ada.png',
  is_public: true,
};

describe('owner Card presentation', () => {
  it('renders identity from the owner profile and a QR that points at the public CodeCard', () => {
    const view = buildOwnerCardPresentation(PROFILE, 'https://app.codecard.test');

    expect(view.displayName).toBe('Ada Lovelace');
    expect(view.headline).toBe('Analytical engine');
    expect(view.avatarUrl).toBe('https://cdn.example/ada.png');
    expect(view.published).toBe(true);
    expect(view.shareUrl).toBe('https://app.codecard.test/ada-lovelace');
    expect(view.shareUrl).not.toContain('source=qr');
    expect(view.qrUrl).toBe('https://app.codecard.test/ada-lovelace?source=qr');
    expect(view.publicUrl).toBe('https://app.codecard.test/ada-lovelace');
    expect(view.publicUrl).not.toContain('/dashboard');
  });

  it('does not emit a scannable QR for an unpublished profile', () => {
    const view = buildOwnerCardPresentation(
      { ...PROFILE, is_public: false },
      'https://app.codecard.test',
    );
    expect(view.published).toBe(false);
    expect(view.qrUrl).toBeNull();
    expect(view.shareUrl).toBe('https://app.codecard.test/ada-lovelace');
  });
});
