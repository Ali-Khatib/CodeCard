import { PublicNotFoundView } from '@/components/public/public-not-found-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'This CodeCard page does not exist or is no longer available.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <PublicNotFoundView />;
}
