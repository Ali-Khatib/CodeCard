const PRODUCTS = [
  { id: 'codecard', label: 'CodeCard' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'github', label: 'GitHub' },
  { id: 'peerlist', label: 'Peerlist' },
] as const;

type ProductId = (typeof PRODUCTS)[number]['id'];

const PURPOSE: Record<ProductId, string> = {
  codecard: 'Work profile you open during an introduction, then keep as a meeting record',
  linkedin: 'Professional network and feed',
  github: 'Code hosting and collaboration',
  peerlist: 'Public proof-of-work profile',
};

/**
 * Distinct CodeCard surfaces only. No duplicate “meeting context” rows,
 * and no claims that other products lack profiles, projects, or generic notes.
 */
const FEATURES: { capability: string; codecard: string }[] = [
  {
    capability: 'Handoff in the conversation',
    codecard:
      'Open the profile on your phone, or they scan a QR and land in a browser in a few seconds',
  },
  {
    capability: 'Connection from that session',
    codecard:
      'Save the person from the interaction itself, instead of hunting a username later',
  },
  {
    capability: 'Introduction record',
    codecard:
      'Date, place, event, private note, and follow-up stored on the same connection',
  },
  {
    capability: 'Home calendar',
    codecard:
      'Events you attend and follow-ups you set, on one month view tied to those people',
  },
  {
    capability: 'Private Circle',
    codecard:
      'People you actually connected with, their work, your notes, and the history of the meeting. No public feed',
  },
  {
    capability: 'What they opened after a scan',
    codecard:
      'QR scans, project opens, research views, and returning visitors',
  },
];

function AbsentCell() {
  return (
    <td className="cc-ed-compare__flag">
      <span className="sr-only">Not a core capability</span>
      <span aria-hidden="true" className="cc-ed-compare__mark">
        —
      </span>
    </td>
  );
}

/**
 * Capability table: in-person introduction workflow vs adjacent products.
 * Factual, not a ranking. Nested after “What CodeCard is”, before feature chapters.
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
          Built for a different moment.
        </h2>
        <p className="cc-ed-compare__sub">
          LinkedIn, GitHub, and Peerlist already cover network, code, and public
          work. The rows below are the CodeCard workflow around an in-person
          introduction.
        </p>
      </header>

      <div className="cc-ed-compare__frame">
        <div className="cc-ed-compare__scroller">
          <table className="cc-ed-compare__table">
            <caption className="sr-only">
              How CodeCard compares with LinkedIn, GitHub, and Peerlist for
              in-person introductions. CodeCard cells describe a native surface.
              Dashes mean that surface is not a core part of the other product.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="cc-ed-compare__capability-h">
                  Capability
                </th>
                {PRODUCTS.map((product) => (
                  <th
                    key={product.id}
                    scope="col"
                    className="cc-ed-compare__product-h"
                  >
                    {product.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="cc-ed-compare__row cc-ed-compare__row--purpose">
                <th scope="row">Primary purpose</th>
                {PRODUCTS.map((product) => (
                  <td key={product.id}>{PURPOSE[product.id]}</td>
                ))}
              </tr>
              {FEATURES.map((row) => (
                <tr key={row.capability} className="cc-ed-compare__row">
                  <th scope="row">{row.capability}</th>
                  <td className="cc-ed-compare__detail">{row.codecard}</td>
                  <AbsentCell />
                  <AbsentCell />
                  <AbsentCell />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="cc-ed-compare__note">
        GitHub hosts the code. LinkedIn builds the professional network. Peerlist
        showcases proof of work. CodeCard connects the introduction to what
        happens next.
      </p>
    </section>
  );
}
