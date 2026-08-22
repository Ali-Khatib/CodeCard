import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { MarketingHashRedirect } from '@/components/landing/marketing-hash-redirect';

export const metadata = buildIndexablePageMetadata({
  path: '/how-it-works',
  title: 'How it works',
  description: 'See how CodeCard presents projects, research, and impact in one identity.',
});

export default function HowItWorksRoute() {
  return <MarketingHashRedirect hash="projects" />;
}
