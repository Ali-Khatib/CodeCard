import { redirect } from 'next/navigation';
import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';

export const metadata = buildIndexablePageMetadata({
  path: '/profiles',
  title: 'See a card',
  description: 'Preview a live CodeCard — your work, projects, and proof in one shareable page.',
});

export default function ProfilesRoute() {
  redirect(LIVE_DEMO_PROFILE_HREF);
}
