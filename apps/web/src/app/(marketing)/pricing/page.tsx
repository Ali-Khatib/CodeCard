import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { PricingLandingPage } from '@/components/landing/pricing-landing-page';

export const metadata = buildIndexablePageMetadata({
  path: '/pricing',
  title: 'Pricing',
  description: 'Simple pricing for CodeCard profiles and featured work.',
});

export default function PricingPage() {
  return <PricingLandingPage />;
}
