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
          <span className="cc-ed__lead">CODECARD ISN’T JUST</span>
          <span className="cc-ed__sub">FOR SHOWING WORK.</span>
        </h2>
        <p className="cc-ed__lede mx-auto mt-5">
          It’s the easiest way to save connections and exchange cards—your
          technical identity, and a card holder for the people you meet.
        </p>
      </div>
    </section>
  );
}
