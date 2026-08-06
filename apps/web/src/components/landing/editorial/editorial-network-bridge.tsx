/**
 * Bridge before Circle + Connections — CodeCard as card holder / exchange.
 */
export function EditorialNetworkBridge() {
  return (
    <section
      id="network"
      className="cc-ed__section cc-ed-network-bridge"
      data-chapter-section="network"
      data-testid="editorial-network-bridge"
      aria-labelledby="editorial-network-bridge-heading"
    >
      <div className="cc-ed-network-bridge__inner">
        <p className="cc-ed__eyebrow">Not just for exchanging cards</p>
        <h2
          id="editorial-network-bridge-heading"
          className="cc-ed__display mt-4"
        >
          <span className="cc-ed__lead">CODECARD IS ALSO</span>
          <span className="cc-ed__sub">YOUR CARD HOLDER.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-5">
          Keep the people you meet, the notes that matter, and the work you
          share in one place you can actually carry.
        </p>
      </div>
    </section>
  );
}
