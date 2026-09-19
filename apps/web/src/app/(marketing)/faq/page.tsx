import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { FaqPage } from '@/components/landing/faq-page';

export const metadata = buildIndexablePageMetadata({
  path: '/faq',
  title: 'FAQ',
  description:
    'Answers about CodeCard: living technical identity, projects, research, real world connections, Circle, events, follow ups, and how it sits next to GitHub and LinkedIn.',
});

export default function FaqRoute() {
  return <FaqPage />;
}
