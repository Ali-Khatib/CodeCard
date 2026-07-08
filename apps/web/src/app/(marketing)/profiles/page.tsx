import { redirect } from 'next/navigation';
import { LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';

export const metadata = {
  title: 'See a card | CodeCard',
  description: 'Preview a live CodeCard — your work, projects, and proof in one shareable page.',
};

export default function ProfilesRoute() {
  redirect(LIVE_DEMO_PROFILE_HREF);
}
