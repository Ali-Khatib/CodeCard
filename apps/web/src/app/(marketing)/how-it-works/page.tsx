import { permanentRedirect } from 'next/navigation';
import { MARKETING_GUIDE_HREF } from '@/lib/marketing/site-routes';

export default function HowItWorksRoute() {
  permanentRedirect(MARKETING_GUIDE_HREF);
}
