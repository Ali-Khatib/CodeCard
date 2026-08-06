import { DossierObject } from './dossier-object';

const LINES = [
  { from: 'Project media', to: 'Projects' },
  { from: 'Paper pages', to: 'Research' },
  { from: 'Impact values', to: 'Analytics' },
  { from: 'Identity strip', to: 'Public profile' },
  { from: 'QR + link', to: 'Share' },
] as const;

export function ProofAssembly() {
  return (
    <section className="cc-proof-assembly" id="assembly" data-testid="proof-assembly">
      <div className="cc-proof-assembly__layout">
        <div className="cc-proof-assembly__copy">
          <p className="cc-proof__mono" style={{ margin: 0, color: 'var(--proof-signal)' }}>
            Assembly
          </p>
          <h2 className="cc-proof__display">ONE IDENTITY SYSTEM.</h2>
          <p className="cc-proof__sans">
            Evidence snaps into a single CodeCard — the dossier someone opens from a link or QR
            when they ask what you build.
          </p>
          <ul className="cc-proof-assembly__list">
            {LINES.map((line) => (
              <li key={line.to}>
                <span className="cc-proof__mono">{line.from}</span>
                <span className="cc-proof__sans">→ {line.to}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="cc-proof-assembly__stage" aria-label="Assembled CodeCard">
          <DossierObject scan />
        </div>
      </div>
    </section>
  );
}
