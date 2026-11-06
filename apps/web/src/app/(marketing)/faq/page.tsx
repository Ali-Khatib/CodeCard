import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { FaqPage } from '@/components/landing/faq-page';

export const metadata = buildIndexablePageMetadata({
  path: '/faq',
  title: 'FAQ',
  description:
    'Answers about sharing a CodeCard, making connections, and using it alongside GitHub and LinkedIn.',
});

export default function FaqRoute() {
  return <FaqPage />;
}
