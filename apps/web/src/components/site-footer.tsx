import Link from 'next/link';
import { LiveDemoLink, isLiveDemoHref } from '@/components/marketing/live-demo-link';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';

const links = {
  product: [
    { href: '/pricing', label: 'Pricing' },
    { href: LIVE_DEMO_HREF, label: 'Live demo' },
    { href: '/sign-up', label: 'Get started' },
  ],
  legal: [
    { href: '/legal/privacy', label: 'Privacy' },
    { href: '/legal/terms', label: 'Terms' },
    { href: '/legal/acceptable-use', label: 'Acceptable Use' },
    { href: '/legal/dmca', label: 'DMCA' },
    { href: '/legal/subscription', label: 'Billing' },
    { href: '/legal/contact', label: 'Contact' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-3">
        <div>
          <p className="text-lg font-semibold">
            Code<span className="text-violet-400">Card</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-zinc-400">
            Share what you build. The modern identity for people who build things. Work first,
            credentials later.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-200">Product</p>
          <ul className="mt-4 space-y-2">
            {links.product.map((link) => (
              <li key={link.href}>
                {isLiveDemoHref(link.href) ? (
                  <LiveDemoLink className="text-sm text-zinc-400 hover:text-zinc-200">
                    {link.label}
                  </LiveDemoLink>
                ) : (
                  <Link href={link.href} className="text-sm text-zinc-400 hover:text-zinc-200">
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-200">Legal</p>
          <ul className="mt-4 space-y-2">
            {links.legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-zinc-400 hover:text-zinc-200">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800 px-6 py-6 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} CodeCard. All rights reserved.
      </div>
    </footer>
  );
}
