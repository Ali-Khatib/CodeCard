import type { Metadata } from 'next';
import { PublicNotFoundView } from '@/components/public/public-not-found-view';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'This CodeCard page does not exist or is no longer available.',
  robots: { index: false, follow: false },
};

export default function PublicSlugNotFound() {
  return (
    <PublicNotFoundView message="This page is unavailable. It may have moved or never existed." />
  );
}
