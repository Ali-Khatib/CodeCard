import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: {lastUpdated}</p>
        <div className="prose prose-invert mt-12 max-w-none space-y-8 text-zinc-300 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
        <Link href="/" className="mt-16 inline-block text-sm text-violet-400 hover:underline">
          ← Back to home
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
