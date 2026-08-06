import { MarketingHashRedirect } from '@/components/landing/marketing-hash-redirect';

export const metadata = {
  title: 'How it works | CodeCard',
  description: 'Seven steps from QR scan or shared link to a saved connection with project proof.',
};

export default function HowItWorksRoute() {
  return <MarketingHashRedirect hash="how-it-works" />;
}
