import { describe, expect, it } from 'vitest';
import { buildIndexablePageMetadata } from './indexable-page-metadata';

describe('buildIndexablePageMetadata', () => {
  it('sets canonical, Open Graph, and Twitter metadata for indexable pages', () => {
    const metadata = buildIndexablePageMetadata({
      path: '/pricing',
      title: 'Pricing',
      description: 'Simple pricing for CodeCard profiles and featured work.',
    });

    expect(metadata.title).toBe('Pricing');
    expect(metadata.description).toBe('Simple pricing for CodeCard profiles and featured work.');
    expect(metadata.alternates).toEqual({ canonical: '/pricing' });
    expect(metadata.openGraph).toMatchObject({
      title: 'Pricing',
      url: '/pricing',
      type: 'website',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, type: 'image/png' }],
    });
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: 'Pricing',
      images: ['/opengraph-image'],
    });
  });

  it('supports absolute homepage titles', () => {
    const metadata = buildIndexablePageMetadata({
      path: '/',
      title: 'CodeCard | Quick showcase for your work',
      description: 'Share your best work by link or QR.',
      absoluteTitle: true,
    });

    expect(metadata.title).toEqual({ absolute: 'CodeCard | Quick showcase for your work' });
    expect(metadata.alternates).toEqual({ canonical: '/' });
  });
});
