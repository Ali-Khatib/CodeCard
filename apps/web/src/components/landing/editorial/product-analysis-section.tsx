/**
 * Analytics — same two-column rhythm as product stories (copy + live demo frame).
 */
import { EditorialProductFrame } from './editorial-product-frame';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import Link from 'next/link';

export function ProductAnalysisSection() {
  return (
    <section
      id="analysis"
      className="cc-ed__section cc-ed-story cc-ed-story--lg cc-ed-analysis"
      data-chapter-section="analysis"
      data-testid="editorial-analysis"
      aria-labelledby="editorial-analysis-heading"
    >
      <div className="cc-ed-story__grid">
        <div className="cc-ed-story__copy">
          <p className="cc-ed__eyebrow">Analytics</p>
          <h2
            id="editorial-analysis-heading"
            className="cc-ed__display mt-4"
          >
            <span className="cc-ed__lead">SEE EVERY SIGNAL.</span>
            <span className="cc-ed__sub">ACT ON WHAT MATTERS.</span>
          </h2>
          <p className="cc-ed__lede mt-5">
            The same Analytics workspace as the live demo: reach, opens, scans,
            and activity in one place so you can act on what matters.
          </p>
          <p className="mt-6">
            <Link href={`${LIVE_DEMO_HREF}/analytics`} className="cc-ed__link">
              Open analytics in the live demo →
            </Link>
          </p>
        </div>
        <div className="cc-ed-story__visual">
          <EditorialProductFrame state="analysis" size="lg" />
        </div>
      </div>
    </section>
  );
}
