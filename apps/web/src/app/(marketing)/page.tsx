import { buildIndexablePageMetadata } from '@/lib/seo/indexable-page-metadata';
import { ProductPage } from '@/components/landing/product-page';

export const metadata = buildIndexablePageMetadata({
  path: '/',
  title: 'CodeCard | Quick showcase for your work',
  description:
    "The fastest way to show someone what you're capable of. Your best work, ready to share by link, QR, or from your phone.",
  absoluteTitle: true,
});

export default function HomePage() {
  return <ProductPage />;
}
