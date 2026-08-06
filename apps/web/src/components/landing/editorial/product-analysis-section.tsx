/**
 * Analysis proof section — former Impact composition, renamed + richer UI.
 */
import { EditorialProductFrame } from './editorial-product-frame';

export function ProductAnalysisSection() {
  return (
    <section
      id="analysis"
      className="cc-ed__section cc-ed-analysis"
      data-chapter-section="analysis"
      data-testid="editorial-analysis"
      aria-labelledby="editorial-analysis-heading"
    >
      <div className="cc-ed-analysis__inner">
        <p className="cc-ed__eyebrow">Analysis</p>
        <h2 id="editorial-analysis-heading" className="cc-ed__display mt-4">
          THE WORK IS THERE.
          <br />
          <span className="cc-ed__accent">MAKE IT VISIBLE.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-5">
          See which profiles, projects, and research items people view, open, and
          share—demo signals from the Alex Chen workspace.
        </p>

        <div className="cc-ed-analysis__frame-wrap">
          <EditorialProductFrame state="analysis" size="lg" />
        </div>
        <p className="cc-ed-analysis__note">Demo metrics · Alex Chen workspace</p>
      </div>
    </section>
  );
}
