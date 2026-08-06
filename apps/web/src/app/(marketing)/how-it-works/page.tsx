import { MarketingHashRedirect } from '@/components/landing/marketing-hash-redirect';

export const metadata = {
  title: 'How it works | CodeCard',
  description: 'See how CodeCard assembles projects, research, and impact into one identity.',
};

export default function HowItWorksRoute() {
  return <MarketingHashRedirect hash="inspect" />;
}
