import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { ProductPage } from '@/components/landing/product-page';

export const metadata = buildIndexablePageMetadata({
  path: '/',
  title: 'CodeCard | Your work. Your identity. Your connections.',
  description:
    'A living technical identity for the real world. Show what you build and research. Connect with people you actually meet. Remember the context. Follow up.',
  absoluteTitle: true,
});

export default function HomePage() {
  return <ProductPage />;
}
