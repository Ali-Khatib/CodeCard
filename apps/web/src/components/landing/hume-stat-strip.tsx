const STATS = [
  { value: '<5 min', label: 'to publish your CodeCard' },
  { value: '1 link', label: 'share by QR or screen' },
  { value: '3×', label: 'more opens with hero video' },
] as const;

export function HumeStatStrip() {
  return (
    <section
      className="border-y border-[var(--border)] bg-paper"
      aria-label="Key metrics"
    >
      <div className="cc-container">
        <ul className="grid divide-[var(--border)] md:grid-cols-3 md:divide-x">
          {STATS.map((stat) => (
            <li
              key={stat.label}
              className="flex flex-col items-center px-6 py-10 text-center md:py-12"
            >
              <p className="font-sans text-[clamp(2rem,4vw,2.75rem)] font-semibold tracking-[-0.03em] text-ink">
                {stat.value}
              </p>
              <p className="mt-2 max-w-[200px] font-eyebrow text-[11px] uppercase tracking-[0.08em] text-smoke">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
