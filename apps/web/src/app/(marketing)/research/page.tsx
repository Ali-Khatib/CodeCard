import Link from 'next/link';
import { ALL_SOURCES_LIST } from '@/lib/research/sources';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';

export const metadata = {
  title: 'Research | CodeCard',
  description:
    'Research papers and sources that inform how CodeCard presents work.',
};

/**
 * Marketing research index — papers only. No story scroll / thesis chrome.
 */
export default function ResearchPage() {
  return (
    <div className="bg-[#fcf1e7] pb-20 text-[#232324]">
      <div className="cc-container py-8 pt-[96px] md:py-12">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#5c5856]">
          Research
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.5rem,6vw,4.5rem)] font-normal tracking-[-0.035em] leading-[0.95]">
          Research papers
        </h1>
        <p className="mt-6 max-w-[40rem] text-[17px] leading-relaxed text-[#5c5856]">
          Peer-reviewed studies, platform research, and UX sources behind how
          CodeCard puts work where people can actually see it. Each entry
          includes the finding and its limits.
        </p>

        <ul className="mt-14 space-y-5">
          {ALL_SOURCES_LIST.map((source) => (
            <li key={source.id}>
              <article
                id={source.id}
                className="rounded-[14px] border border-[rgba(35,35,36,0.1)] bg-white p-6 md:p-8"
              >
                <h2 className="text-[22px] font-semibold tracking-[-0.02em] md:text-[24px]">
                  {source.title}
                </h2>
                <p className="mt-2 text-[15px] text-[#5c5856]">
                  {source.authors} · {source.year} · {source.studyType}
                </p>
                <dl className="mt-5 space-y-4 text-[16px] leading-relaxed">
                  <div>
                    <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5c5856]">
                      Sample
                    </dt>
                    <dd className="mt-1">{source.sampleSize}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5c5856]">
                      Finding
                    </dt>
                    <dd className="mt-1">{source.finding}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5c5856]">
                      Limitation
                    </dt>
                    <dd className="mt-1 text-[#5c5856]">{source.limitation}</dd>
                  </div>
                </dl>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex text-[15px] font-medium text-[#7c5cad] underline-offset-4 hover:underline"
                >
                  Open paper →
                </a>
              </article>
            </li>
          ))}
        </ul>

        <p className="mt-12">
          <Link
            href={MARKETING_HOME_HREF}
            className="text-[15px] font-medium text-[#7c5cad] underline-offset-4 hover:underline"
          >
            ← Back to CodeCard
          </Link>
        </p>
      </div>
    </div>
  );
}
