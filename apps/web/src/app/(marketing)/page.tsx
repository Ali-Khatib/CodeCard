import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { ProductPage } from '@/components/landing/product-page';

export const metadata = buildIndexablePageMetadata({
  path: '/',
  title: 'CodeCard | Share your work. Keep the connection.',
  description:
    'A professional profile for real-world introductions. Show projects and research from your phone, then keep the people you meet with the context to follow up.',
  absoluteTitle: true,
});

export default function HomePage() {
  return <ProductPage />;
}
