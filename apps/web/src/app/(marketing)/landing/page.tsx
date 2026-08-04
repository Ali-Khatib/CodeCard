import { permanentRedirect } from 'next/navigation';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';

/** Backward-compatible alias for the marketing homepage. */
export default function LandingAliasPage() {
  permanentRedirect(MARKETING_HOME_HREF);
}
