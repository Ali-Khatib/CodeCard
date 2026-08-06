import dynamic from 'next/dynamic';
import '@/styles/proof-dossier.css';
import { ProofColdOpen } from './proof-cold-open';
import { ProofEvidenceWall } from './proof-evidence-wall';
import { ProofAssembly } from './proof-assembly';
import { ProofInPractice } from './proof-in-practice';
import { ProofFinale } from './proof-finale';

const ProofInspection = dynamic(
  () => import('./proof-inspection').then((m) => m.ProofInspection),
  {
    ssr: true,
    loading: () => <section className="cc-proof-inspect" aria-label="Product inspection" />,
  },
);

/** Art-directed marketing experience — YOUR WORK IS THE PROOF. */
export function ProofLanding() {
  return (
    <div className="cc-proof" data-proof-landing data-testid="proof-landing">
      <ProofColdOpen />
      <ProofEvidenceWall />
      <ProofAssembly />
      <ProofInspection />
      <ProofInPractice />
      <ProofFinale />
    </div>
  );
}
