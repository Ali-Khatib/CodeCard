'use client';

/** Frame.io-style product frame for hero / feature sections */
export function ProductMockupFrame({ className = '' }: { className?: string }) {
  return (
    <div
      className={`cc-product-mockup ${className}`}
      style={{ transform: `translateY(calc(var(--scroll-y, 0) * -24px))` }}
    >
      <div className="cc-product-mockup__chrome">
        <div className="cc-product-mockup__bar">
          <span className="cc-product-mockup__dot" />
          <span className="cc-product-mockup__dot" />
          <span className="cc-product-mockup__dot" />
        </div>
        <div className="cc-product-mockup__body">
          <div className="cc-product-mockup__sidebar" />
          <div className="cc-product-mockup__main">
            <div className="cc-product-mockup__hero-tile" />
            <div className="cc-product-mockup__row">
              <div className="cc-product-mockup__card" />
              <div className="cc-product-mockup__card" />
            </div>
            <div className="cc-product-mockup__thread">
              <span className="cc-product-mockup__avatar" />
              <div className="cc-product-mockup__lines">
                <div />
                <div />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
