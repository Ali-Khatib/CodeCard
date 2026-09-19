import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { FaqPage } from '@/components/landing/faq-page';

export const metadata = buildIndexablePageMetadata({
  path: '/faq',
  title: 'FAQ',
  description:
    'Answers about CodeCard: showcasing work in person, connecting with people you meet, and following up after.',
});

export default function FaqRoute() {
  return <FaqPage />;
}
