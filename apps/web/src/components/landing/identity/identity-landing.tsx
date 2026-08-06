import dynamic from 'next/dynamic';
import { IdentityHero } from './identity-hero';
import { IdentityFinale } from './identity-finale';
import '@/styles/cinematic-identity.css';

const IdentityAssembly = dynamic(
  () => import('./identity-assembly').then((m) => m.IdentityAssembly),
  {
    ssr: true,
    loading: () => (
      <section
        className="scroll-mt-28 py-20"
        aria-label="Identity assembly"
        data-testid="identity-assembly-fallback"
      />
    ),
  },
);

const IdentityInspect = dynamic(
  () => import('./identity-inspect').then((m) => m.IdentityInspect),
  {
    ssr: true,
    loading: () => (
      <section
        className="scroll-mt-28 py-20"
        aria-label="Identity inspection"
        data-testid="identity-inspect-fallback"
      />
    ),
  },
);

export function IdentityLanding() {
  return (
    <div className="cc-id pb-16" data-testid="identity-landing">
      <IdentityHero />
      <IdentityAssembly />
      <IdentityInspect />
      <IdentityFinale />
    </div>
  );
}
