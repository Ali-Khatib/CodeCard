import Link from 'next/link';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import { DossierObject } from './dossier-object';

export function ProofFinale() {
  return (
    <section className="cc-proof-finale" id="build-yours" data-testid="proof-finale">
      <div>
        <div className="cc-proof-finale__object">
          <DossierObject />
        </div>
        <h2 className="cc-proof__display">
          BUILD YOUR <em>PROOF.</em>
        </h2>
        <p className="cc-proof__sans" style={{ margin: '1rem auto 0', maxWidth: '36ch', color: 'var(--proof-smoke)' }}>
          Your best work. Ready to share in seconds — by link, QR, or straight from your screen.
        </p>
        <div className="cc-proof-finale__actions">
          <Link href="/sign-up" className="cc-proof-btn cc-proof-btn--signal">
            Create your CodeCard
          </Link>
          <Link
            href={LIVE_DEMO_HREF}
            className="cc-proof-btn cc-proof-btn--ghost"
            data-testid="closing-profile-preview-link"
          >
            Enter the live workspace
          </Link>
        </div>
      </div>
    </section>
  );
}
