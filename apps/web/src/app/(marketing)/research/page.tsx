import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { ResearchIndexPage } from '@/components/research/research-index-page';

export const metadata = buildIndexablePageMetadata({
  path: '/research',
  title: 'Research',
  description: 'Research papers and sources that inform how CodeCard presents work.',
});

/**
 * Marketing research index — New Form–inspired stats + expandable paper library.
 */
export default function ResearchPage() {
  return <ResearchIndexPage />;
}
