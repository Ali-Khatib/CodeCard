import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { StoryHow } from '@/components/story/story-how';

export const metadata = buildIndexablePageMetadata({
  path: '/how-it-works',
  title: 'How CodeCard works | One introduction. Everything connected.',
  description:
    'Build your professional identity, share your work with a QR code, and keep the people you meet with the context to follow up.',
  absoluteTitle: true,
});

export default function HowItWorksRoute() {
  return <StoryHow />;
}
