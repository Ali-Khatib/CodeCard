import Link from 'next/link';
import { ALL_SOURCES_LIST } from '@/lib/research/sources';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';

export const metadata = {
  title: 'Research references | CodeCard',
  description: 'Complete bibliography for CodeCard research-backed design decisions.',
};

export default function ResearchReferencesPage() {
  return (
    <div className="pb-16">
      <main className="cc-container py-8 pt-[96px] md:py-12">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-text-secondary">Bibliography</p>
        <h1 className="mt-3 text-[40px] font-extrabold tracking-tight md:text-[56px]">Research references</h1>
        <p className="mt-6 max-w-[720px] text-[18px] leading-relaxed text-text-secondary">
          CodeCard cites peer-reviewed studies, meta-analyses, platform research and established UX principles. Each
          finding is presented with limitations. We do not claim universal hiring laws.
        </p>

        <div className="mt-14 space-y-6">
          {ALL_SOURCES_LIST.map((source) => (
            <article
              key={source.id}
              id={source.id}
              className="rounded-[10px] border border-border bg-surface p-6 md:p-8"
            >
              <h2 className="text-[22px] font-bold md:text-[24px]">{source.title}</h2>
              <p className="mt-2 text-[16px] text-text-secondary">
                {source.authors} · {source.year} · {source.studyType}
              </p>
              <dl className="mt-5 space-y-3 text-[17px]">
                <div>
                  <dt className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary">Sample</dt>
                  <dd className="mt-1">{source.sampleSize}</dd>
                </div>
                <div>
                  <dt className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary">Finding</dt>
                  <dd className="mt-1 leading-relaxed">{source.finding}</dd>
                </div>
                <div>
                  <dt className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary">Limitation</dt>
                  <dd className="mt-1 text-text-secondary">{source.limitation}</dd>
                </div>
              </dl>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex text-[15px] font-semibold text-accent hover:underline"
              >
                External source →
              </a>
            </article>
          ))}
        </div>

        <div className="mt-16 rounded-[10px] border border-border bg-surface/60 p-8 text-center">
          <p className="text-[18px] text-text-secondary">See how this research shapes the CodeCard experience.</p>
          <Link
            href={`${MARKETING_HOME_HREF}#research`}
            className="mt-4 inline-flex h-12 items-center rounded-[10px] border border-border bg-surface px-6 text-[15px] font-semibold"
          >
            Back to evidence overview
          </Link>
        </div>
      </main>
    </div>
  );
}
