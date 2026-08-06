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
        <p className="cc-ed__eyebrow">More than a showcase</p>
        <h2
          id="editorial-network-bridge-heading"
          className="cc-ed__display mt-4"
        >
          <span className="cc-ed__lead">NOT JUST FOR SHOWING WORK.</span>
          <span className="cc-ed__sub">
            Save connections and exchange cards in one place.
          </span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-5">
          CodeCard is your technical identity—and a card holder for the people
          you actually meet.
        </p>
      </div>
    </section>
  );
}
