import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { GuidePage } from '@/components/landing/guide-page';
import { MARKETING_GUIDE_HREF } from '@/lib/marketing/site-routes';

export const metadata = buildIndexablePageMetadata({
  path: MARKETING_GUIDE_HREF,
  title: 'Guide',
  description:
    'A walkthrough of the CodeCard workspace: Home, Your Work, Connections, Circle, Analytics, and Settings.',
});

export default function GuideRoute() {
  return <GuidePage />;
}
