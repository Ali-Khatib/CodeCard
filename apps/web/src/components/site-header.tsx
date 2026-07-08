import Link from 'next/link';
import { Button } from '@codecard/ui';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';

export function SiteHeader() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Code<span className="text-violet-400">Card</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <Link href="/pricing" className="transition-colors hover:text-zinc-100">
            Pricing
          </Link>
          <LiveDemoLink className="transition-colors hover:text-zinc-100">
            Live demo
          </LiveDemoLink>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
