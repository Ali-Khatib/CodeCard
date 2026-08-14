import type { Metadata } from 'next';
import { ProductPage } from '@/components/landing/product-page';

export const metadata: Metadata = {
  title: {
    absolute: 'CodeCard | Quick showcase for your work',
  },
  description:
    "The fastest way to show someone what you're capable of. Your best work, ready to share by link, QR, or from your phone.",
  alternates: { canonical: '/' },
  openGraph: {
    title: 'CodeCard | Quick showcase for your work',
    description:
      "The fastest way to show someone what you're capable of. Your best work, ready to share by link, QR, or from your phone.",
    url: '/',
    type: 'website',
  },
};

export default function HomePage() {
  return <ProductPage />;
}
