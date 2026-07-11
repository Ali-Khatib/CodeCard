import Link from 'next/link';
import { LandingShellNav } from '@/components/landing/landing-shell-nav';
import { HumeFooterCluster } from '@/components/landing/hume-footer-cluster';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="cc-marketing-shell min-h-screen bg-bone text-ink">
      <LandingShellNav />
      <main className="cc-container pb-20 pt-32 md:pb-28 md:pt-40">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-[rgba(35,35,36,0.08)] bg-white/72 p-8 shadow-[0_20px_80px_rgba(35,35,36,0.08)] backdrop-blur md:p-12">
          <p className="font-eyebrow text-[11px] uppercase tracking-[0.14em] text-smoke">
            Legal
          </p>
          <h1 className="mt-4 font-display text-[44px] font-normal leading-[1.02] tracking-[-0.04em] text-ink md:text-[64px]">
            {title}
          </h1>
          <p className="mt-4 text-sm text-smoke">Last updated: {lastUpdated}</p>
          <div className="mt-12 space-y-8 text-[16px] leading-relaxed text-smoke [&_h2]:font-display [&_h2]:text-[28px] [&_h2]:font-normal [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h2]:text-ink [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
            {children}
          </div>
          <Link href={MARKETING_HOME_HREF} className="cc-btn-pill-ghost mt-12 inline-flex h-11 px-6 text-[14px]">
            Back to home
          </Link>
        </div>
      </main>
      <HumeFooterCluster />
    </div>
  );
}
