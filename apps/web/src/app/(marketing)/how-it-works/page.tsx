import { MarketingHashRedirect } from '@/components/landing/marketing-hash-redirect';

export const metadata = {
  title: 'How it works | CodeCard',
  description: 'See how CodeCard presents projects, research, and impact in one identity.',
};

export default function HowItWorksRoute() {
  return <MarketingHashRedirect hash="projects" />;
}
