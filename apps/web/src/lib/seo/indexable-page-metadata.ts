import type { Metadata } from 'next';
import {
  PUBLIC_OG_IMAGE_HEIGHT,
  PUBLIC_OG_IMAGE_WIDTH,
} from '@/lib/profile/public-metadata';

const SITE_OG_IMAGE_PATH = '/opengraph-image';

type IndexablePath = '/' | `/${string}`;

export function buildIndexablePageMetadata(input: {
  path: IndexablePath;
  title: string;
  description: string;
  /** Homepage-style title without the root `%s | CodeCard` template. */
  absoluteTitle?: boolean;
  openGraphType?: 'website' | 'article';
  ogImagePath?: string;
}): Metadata {
  const canonical = input.path;
  const ogImagePath = input.ogImagePath ?? SITE_OG_IMAGE_PATH;

  const metadata: Metadata = {
    description: input.description,
    alternates: { canonical },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      type: input.openGraphType ?? 'website',
      images: [
        {
          url: ogImagePath,
          width: PUBLIC_OG_IMAGE_WIDTH,
          height: PUBLIC_OG_IMAGE_HEIGHT,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [ogImagePath],
    },
  };

  metadata.title = input.absoluteTitle ? { absolute: input.title } : input.title;

  return metadata;
}
