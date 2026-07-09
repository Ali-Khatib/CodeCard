import Link from 'next/link';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="cc-marketing-shell relative z-[1] flex min-h-screen flex-col items-center justify-start bg-bone px-6 py-16 pt-28 md:justify-center md:pt-16">
      <div className="w-full max-w-[440px]">
        <Link
          href="/"
          className="mb-8 block text-center text-[20px] font-medium tracking-[-0.02em] text-ink"
        >
          CodeCard
        </Link>
        <div className="rounded-[24px] border border-[rgba(34,34,34,0.08)] bg-white/80 p-8 shadow-[0_20px_80px_rgba(35,35,36,0.08)] backdrop-blur">
          <h1 className="text-[26px] font-medium tracking-[-0.025em] text-ink">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-[15px] leading-relaxed text-smoke">{subtitle}</p>
          )}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
