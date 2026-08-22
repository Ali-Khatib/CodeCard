import type { Metadata } from 'next';
import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';

export const metadata: Metadata = buildIndexablePageMetadata({
  path: '/sign-up',
  title: 'Create your CodeCard',
  description:
    'Create a CodeCard account and publish a shareable profile for your projects and research.',
});

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
