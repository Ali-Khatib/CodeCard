import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { ProductPage } from '@/components/landing/product-page';

export const metadata = buildIndexablePageMetadata({
  path: '/',
  title: 'CodeCard | Show your work. Connect. Follow up.',
  description:
    'The quickest way to impress someone with your work. Show your CodeCard from your phone, connect with people you actually meet, and follow up.',
  absoluteTitle: true,
});

export default function HomePage() {
  return <ProductPage />;
}
