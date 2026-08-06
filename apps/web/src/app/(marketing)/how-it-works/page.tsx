import { MarketingHashRedirect } from '@/components/landing/marketing-hash-redirect';

export const metadata = {
  title: 'How it works | CodeCard',
  description: 'See how a QR or link opens into a full CodeCard story.',
};

export default function HowItWorksRoute() {
  return <MarketingHashRedirect hash="how-it-works" />;
}
