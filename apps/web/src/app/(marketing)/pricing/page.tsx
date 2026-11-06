import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { Cc2Pricing } from '@/components/cc2/pricing';

export const metadata = buildIndexablePageMetadata({
  path: '/pricing',
  title: 'Pricing',
  description: 'Simple pricing for CodeCard profiles and featured work.',
});

export default function PricingPage() {
  return <Cc2Pricing />;
}
