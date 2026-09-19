import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { ProductPage } from '@/components/landing/product-page';

export const metadata = buildIndexablePageMetadata({
  path: '/',
  title: 'CodeCard | Impress in the room. Keep who you met.',
  description:
    'Impress in the room. Keep the people you actually met. Follow up so you do not lose them.',
  absoluteTitle: true,
});

export default function HomePage() {
  return <ProductPage />;
}
