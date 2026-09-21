import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { CodeCardMark } from '@/components/brand/codecard-mark';

const PRODUCTS = [
  { id: 'codecard', label: 'CodeCard' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'github', label: 'GitHub' },
  { id: 'peerlist', label: 'Peerlist' },
] as const;

type ProductId = (typeof PRODUCTS)[number]['id'];

const DEFINITIONS: Record<ProductId, { use: string; vs: string }> = {
  codecard: {
    use: 'When the conversation turns to your work, you open it on your phone or they scan a QR.',
    vs: 'If you stay in touch, that person, the venue, and the next step stay on the same private record.',
  },
  linkedin: {
    use: 'After you already have a name, you search a public graph, post, and message.',
    vs: 'You mainly use it as a public professional network.',
  },
  github: {
    use: 'You host and review code with people who already know the repo.',
    vs: 'You mainly use it to host and review code.',
  },
  peerlist: {
    use: 'You publish launches and writeups for a public builder audience.',
    vs: 'You mainly use it as a public builder feed.',
  },
};

/**
 * Distinct CodeCard surfaces only. No duplicate “meeting context” rows,
 * and no claims that other products lack profiles, projects, or generic notes.
 */
const FEATURES = [
  'Open the work in the room, on your phone or with a QR',
  'Keep the person from that introduction, not a later search',
  'Time, place, private note, and next step on the same person',
  'Events and follow-ups in a single calendar',
  'Private circle of people you actually exchanged with',
  'See which projects and papers they opened after the scan',
] as const;

function PeerlistMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M12.1 1.6c-5.2 0-9.4 4.2-9.4 9.4 0 4.3 2.9 8 6.9 9.1v2.3h2.6v-2.2c.3 0 .6.1.9.1 5.2 0 9.4-4.2 9.4-9.4S17.3 1.6 12.1 1.6zm.1 16.2c-.3 0-.6 0-.9-.1V8.3H9.1v-2h6.4c2.1 0 3.6 1.5 3.6 3.5 0 2.1-1.5 3.6-3.6 3.6h-2.3v4.4zm2.3-6.7c.8 0 1.3-.5 1.3-1.3s-.5-1.3-1.3-1.3h-2.2v2.6h2.2z" />
    </svg>
  );
}

function ProductLogo({ id }: { id: ProductId }) {
  if (id === 'codecard') {
    return <CodeCardMark className="cc-ed-compare__mark-svg" />;
  }
  if (id === 'linkedin') {
    return <FaLinkedin aria-hidden />;
  }
  if (id === 'github') {
    return <FaGithub aria-hidden />;
  }
  return <PeerlistMark />;
}

function CompareFit({ children }: { children: ReactNode }) {
  return (
    <div className="cc-ed-compare__frame">
      <div className="cc-ed-compare__scroller" data-compare-fit>
        <div className="cc-ed-compare__board">{children}</div>
      </div>
    </div>
  );
}

function FlagCell({ available }: { available: boolean }) {
  return (
    <td
      className={
        available
          ? 'cc-ed-compare__flag cc-ed-compare__flag--yes'
          : 'cc-ed-compare__flag cc-ed-compare__flag--no'
      }
    >
      <span className="sr-only">
        {available ? 'Available on CodeCard' : 'Not a core capability'}
      </span>
      {available ? (
        <Check aria-hidden className="cc-ed-compare__icon" strokeWidth={2.6} />
      ) : (
        <X aria-hidden className="cc-ed-compare__icon" strokeWidth={2.4} />
      )}
    </td>
  );
}

/**
 * Capability table: in-person introduction workflow vs adjacent products.
 * Nested after the in-the-room intro, before feature chapters.
 */
export function EditorialComparison() {
  return (
    <section
      id="how-it-compares"
      className="cc-ed-compare"
      data-testid="editorial-comparison"
      aria-labelledby="editorial-comparison-heading"
    >
      <header className="cc-ed-compare__intro">
        <p className="cc-ed__eyebrow">The category</p>
        <h2 id="editorial-comparison-heading" className="cc-ed-compare__heading">
          Built for the handshake.
        </h2>
      </header>

      <CompareFit>
          <table className="cc-ed-compare__table">
            <caption className="sr-only">
              How CodeCard compares with LinkedIn, GitHub, and Peerlist for
              in-person introductions. Checks mark a native CodeCard surface.
              Crosses mean that surface is not a core part of the other product.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="cc-ed-compare__capability-h">
                  <span className="sr-only">Capability</span>
                </th>
                {PRODUCTS.map((product) => (
                  <th
                    key={product.id}
                    scope="col"
                    className={`cc-ed-compare__product-h cc-ed-compare__product-h--${product.id}`}
                  >
                    <span className="sr-only">{product.label}</span>
                    <span className="cc-ed-compare__logo" aria-hidden="true">
                      <ProductLogo id={product.id} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="cc-ed-compare__row cc-ed-compare__row--define">
                <th scope="row">
                  <span className="cc-ed-compare__define-label">Definition</span>
                  Use case, and what it is mainly for.
                </th>
                {PRODUCTS.map((product) => {
                  const definition = DEFINITIONS[product.id];
                  return (
                    <td key={product.id} className="cc-ed-compare__define">
                      <span className="sr-only">{product.label}. </span>
                      <p className="cc-ed-compare__define-use">
                        {definition.use}
                      </p>
                      <p className="cc-ed-compare__define-vs">
                        {definition.vs}
                      </p>
                    </td>
                  );
                })}
              </tr>
              {FEATURES.map((capability) => (
                <tr key={capability} className="cc-ed-compare__row">
                  <th scope="row">{capability}</th>
                  <FlagCell available />
                  <FlagCell available={false} />
                  <FlagCell available={false} />
                  <FlagCell available={false} />
                </tr>
              ))}
            </tbody>
          </table>
      </CompareFit>

      <p className="cc-ed-compare__note">
        Adjacent tools already own code, network, and public proof. CodeCard
        owns the path from handshake to the next action.
      </p>
    </section>
  );
}
