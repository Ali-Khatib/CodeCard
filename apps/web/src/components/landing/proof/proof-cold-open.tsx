import Link from 'next/link';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import { DossierObject } from './dossier-object';
import { PROOF_TICKER } from './proof-content';
import { ProofColdOpenClient } from './proof-cold-open-client';

/**
 * Cold open — LCP statement is server-rendered and never hidden before paint.
 * Client island only handles ticker duplication + pointer scan.
 */
export function ProofColdOpen() {
  return (
    <section className="cc-proof-open" data-testid="proof-cold-open" data-hero-section aria-labelledby="proof-statement">
      <div className="cc-proof-open__stage" data-testid="hero-section">
        <div className="cc-proof-open__statement">
          <p className="cc-proof__mono" style={{ color: 'var(--proof-signal)', margin: 0 }}>
            CodeCard · Technical identity
          </p>
          <h1 id="proof-statement" className="cc-proof__display" data-hero-statement>
            <span>YOUR WORK</span>
            <span>
              IS THE <em>PROOF.</em>
            </span>
          </h1>
          <p className="cc-proof-open__support cc-proof__sans">
            Projects, research and impact—assembled into one technical identity. Your best work,
            ready to share in seconds.
          </p>
          <div className="cc-proof-open__actions">
            <Link href="/sign-up" className="cc-proof-btn cc-proof-btn--signal" data-testid="hero-primary-cta">
              Create your CodeCard
            </Link>
            <Link href={LIVE_DEMO_HREF} className="cc-proof-btn cc-proof-btn--ghost">
              Enter the live workspace
            </Link>
          </div>
        </div>

        <div className="cc-proof-open__object">
          <ProofColdOpenClient>
            <DossierObject scan />
          </ProofColdOpenClient>
        </div>
      </div>

      <div className="cc-proof-open__ticker" aria-hidden>
        <div className="cc-proof-open__ticker-track">
          {[...PROOF_TICKER, ...PROOF_TICKER].map((item, i) => (
            <span key={`${item}-${i}`} className="cc-proof-open__ticker-item cc-proof__mono">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
