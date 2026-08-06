import Image from 'next/image';
import { DEMO_FEATURED_PROJECTS } from '@/lib/projects/demo-data';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import { PROOF_CHAPTERS } from './proof-content';

const QR_SIZE = 13;

function isQrFilled(index: number) {
  const row = Math.floor(index / QR_SIZE);
  const col = index % QR_SIZE;
  const finder = (r: number, c: number, sr: number, sc: number) => {
    const rr = r - sr;
    const cc = c - sc;
    if (rr < 0 || rr > 4 || cc < 0 || cc > 4) return false;
    return rr === 0 || rr === 4 || cc === 0 || cc === 4 || (rr >= 2 && rr <= 3 && cc >= 2 && cc <= 3);
  };
  if (finder(row, col, 0, 0) || finder(row, col, 0, 8) || finder(row, col, 8, 0)) return true;
  return (row * 7 + col * 5) % 11 < 4 || (row + col) % 7 === 0;
}

export function ProofEvidenceWall() {
  const lead = DEMO_FEATURED_PROJECTS[0]!;
  const second = DEMO_FEATURED_PROJECTS[1]!;
  const paper = DEMO_RESEARCH_PAPERS[0]!;

  return (
    <section className="cc-proof-wall" id="evidence" data-testid="proof-evidence-wall">
      <div className="cc-proof-wall__header">
        <h2 className="cc-proof__display">THE EVIDENCE WALL.</h2>
        <p className="cc-proof__sans">
          Not labeled pills. Real artifacts from the work — projects, papers, metrics, and the share
          surface that carries them.
        </p>
      </div>

      <div className="cc-proof-wall__chapters" aria-label="Evidence chapters">
        {PROOF_CHAPTERS.map((chapter) => (
          <div key={chapter.id} className="cc-proof-wall__chapter">
            <strong className="cc-proof__mono">
              {chapter.id} / {chapter.label}
            </strong>
            <span>{chapter.label}</span>
            <p>{chapter.detail}</p>
          </div>
        ))}
      </div>

      <div className="cc-proof-wall__grid">
        <article className="cc-proof-artifact cc-proof-artifact--xl">
          <div className="cc-proof-artifact__media">
            {lead.posterUrl ? (
              <Image src={lead.posterUrl} alt="" fill sizes="(max-width: 900px) 100vw, 66vw" priority={false} />
            ) : null}
          </div>
          <span className="cc-proof-artifact__label cc-proof__mono">01 · PROJECT</span>
          <div className="cc-proof-artifact__body" style={{ background: 'linear-gradient(0deg, rgba(10,10,10,0.82), transparent 55%)', color: '#f4efe6' }}>
            <div className="cc-proof-artifact__title">{lead.title}</div>
            <p className="cc-proof-artifact__note" style={{ color: 'rgba(244,239,230,0.72)' }}>
              {lead.tagline}
            </p>
          </div>
        </article>

        <article className="cc-proof-artifact cc-proof-artifact--lg">
          <div className="cc-proof-paper">
            <p className="cc-proof-paper__kicker cc-proof__mono">02 · RESEARCH</p>
            <h3>{paper.title}</h3>
            <p>
              {paper.abstract?.slice(0, 160) ??
                'Abstract, venue, and citations live beside the system that implements the work.'}
              …
            </p>
          </div>
        </article>

        <article className="cc-proof-artifact cc-proof-artifact--md">
          <pre className="cc-proof-code">{`commit 8f3a2c1
Author: Jordan Lee
Date:   2026-03-14

    ship pipeline drift detection

 packages/ci/detect.ts | 84 ++++++
 packages/ci/types.ts  | 12 +++`}</pre>
          <span className="cc-proof-artifact__label cc-proof__mono">GIT</span>
        </article>

        <article className="cc-proof-artifact cc-proof-artifact--md">
          <div className="cc-proof-metric">
            <p className="cc-proof__mono" style={{ margin: 0, color: 'var(--proof-smoke)' }}>
              03 · IMPACT
            </p>
            <strong>1.2k</strong>
            <p className="cc-proof__mono" style={{ margin: 0, color: 'var(--proof-smoke)' }}>
              Profile views · 86 saves
            </p>
          </div>
        </article>

        <article className="cc-proof-artifact cc-proof-artifact--sm">
          <div className="cc-proof-artifact__media">
            {second.posterUrl ? (
              <Image src={second.posterUrl} alt="" fill sizes="33vw" />
            ) : null}
          </div>
          <span className="cc-proof-artifact__label cc-proof__mono">{second.title}</span>
        </article>

        <article className="cc-proof-artifact cc-proof-artifact--sm">
          <div className="cc-proof-qr" aria-hidden>
            <div
              className="cc-proof-qr__grid"
              style={{
                gridTemplateColumns: `repeat(${QR_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${QR_SIZE}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: QR_SIZE * QR_SIZE }).map((_, i) => (
                <span
                  key={i}
                  className={`cc-proof-qr__cell ${isQrFilled(i) ? '' : 'cc-proof-qr__cell--empty'}`}
                />
              ))}
            </div>
          </div>
          <span className="cc-proof-artifact__label cc-proof__mono">04 · SHARE</span>
        </article>

        <article className="cc-proof-artifact cc-proof-artifact--md">
          <div className="cc-proof-paper">
            <p className="cc-proof-paper__kicker cc-proof__mono">DIAGRAM</p>
            <h3>Attention under load</h3>
            <p>Model result strip · latency · precision · citation graph attached to the build.</p>
            <svg viewBox="0 0 240 80" width="100%" height="72" aria-hidden style={{ marginTop: 12 }}>
              <polyline
                fill="none"
                stroke="#ff5c33"
                strokeWidth="2"
                points="0,60 30,52 60,55 90,30 120,36 150,18 180,24 210,10 240,14"
              />
              <line x1="0" y1="70" x2="240" y2="70" stroke="#2a2a2a" strokeWidth="1" />
            </svg>
          </div>
        </article>
      </div>
    </section>
  );
}
