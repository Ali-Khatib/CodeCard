import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create your CodeCard',
  description:
    'Create a CodeCard account and publish a shareable profile for your projects and research.',
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
