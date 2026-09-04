import Link from 'next/link';
import { LandingShellNav } from '@/components/landing/landing-shell-nav';
import { HumeFooterCluster } from '@/components/landing/hume-footer-cluster';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';

export type LegalTocItem = {
  href: string;
  label: string;
};

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  toc?: LegalTocItem[];
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, toc, children }: LegalPageProps) {
  return (
    <div className="cc-marketing-shell min-h-screen bg-bone text-ink">
      <LandingShellNav />
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="cc-container pb-20 pt-32 md:pb-28 md:pt-40"
      >
        <div className="mx-auto max-w-3xl rounded-[28px] border border-[rgba(35,35,36,0.08)] bg-white/72 p-8 shadow-[0_20px_80px_rgba(35,35,36,0.08)] backdrop-blur md:p-12">
          <p className="font-eyebrow text-[11px] uppercase tracking-[0.14em] text-smoke">
            Legal
          </p>
          <h1 className="mt-4 font-display text-[44px] font-normal leading-[1.02] tracking-[-0.04em] text-ink md:text-[64px]">
            {title}
          </h1>
          <p className="mt-4 text-sm text-smoke">Last updated: {lastUpdated}</p>
          {toc && toc.length > 0 ? (
            <nav aria-label="On this page" className="mt-8 rounded-[20px] border border-[rgba(35,35,36,0.08)] bg-[rgba(35,35,36,0.03)] p-5 md:p-6">
              <p className="font-eyebrow text-[11px] uppercase tracking-[0.14em] text-smoke">
                On this page
              </p>
              <ol className="mt-3 space-y-2 text-[14px] leading-snug text-smoke">
                {toc.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="font-medium text-ink underline decoration-[rgba(35,35,36,0.28)] underline-offset-[3px] transition-opacity hover:opacity-70"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <div className="mt-12 space-y-8 text-[16px] leading-relaxed text-smoke [&_a:hover]:opacity-70 [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:decoration-[rgba(35,35,36,0.28)] [&_a]:underline-offset-[3px] [&_a]:transition-opacity [&_h2]:scroll-mt-28 [&_h2]:font-display [&_h2]:text-[28px] [&_h2]:font-normal [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h2]:text-ink [&_h3]:scroll-mt-28 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-[20px] [&_h3]:font-normal [&_h3]:leading-snug [&_h3]:tracking-[-0.02em] [&_h3]:text-ink [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
            {children}
          </div>
          <Link
            href={MARKETING_HOME_HREF}
            className="cc-btn-pill-ghost mt-12 inline-flex h-11 px-6 text-[14px]"
          >
            Back to home
          </Link>
        </div>
      </main>
      <HumeFooterCluster />
    </div>
  );
}
