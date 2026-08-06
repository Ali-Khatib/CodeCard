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
        <p className="cc-ed__eyebrow">Also a card holder</p>
        <h2
          id="editorial-network-bridge-heading"
          className="cc-ed__display mt-4"
        >
          <span className="cc-ed__lead">CODECARD IS ALSO</span>
          <span className="cc-ed__sub">YOUR CARD HOLDER.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-5">
          Showcase your work, then save the people you meet. Exchange cards,
          keep notes, and carry your technical identity like a wallet.
        </p>
      </div>
    </section>
  );
}
