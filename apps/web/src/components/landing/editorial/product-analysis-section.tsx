/**
 * Analysis — same two-column rhythm as product stories (copy + frame).
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
          <p className="cc-ed__eyebrow">Analysis</p>
          <h2
            id="editorial-analysis-heading"
            className="cc-ed__display mt-4"
          >
            <span className="cc-ed__lead">SEE EVERY SIGNAL.</span>
            <span className="cc-ed__sub">ACT ON WHAT MATTERS.</span>
          </h2>
          <p className="cc-ed__lede mt-5">
            Profile views, project opens, research reads, Circle shares, QR
            scans, and follow ups. One place to read how your work travels.
          </p>
          <p className="mt-6">
            <Link href={`${LIVE_DEMO_HREF}`} className="cc-ed__link">
              Open analysis in the live demo →
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
