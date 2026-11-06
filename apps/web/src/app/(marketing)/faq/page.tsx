import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { Cc2Faq } from '@/components/cc2/faq';

export const metadata = buildIndexablePageMetadata({
  path: '/faq',
  title: 'FAQ',
  description:
    'Answers about sharing a CodeCard, making connections, and using it alongside GitHub and LinkedIn.',
});

export default function FaqRoute() {
  return <Cc2Faq />;
}
