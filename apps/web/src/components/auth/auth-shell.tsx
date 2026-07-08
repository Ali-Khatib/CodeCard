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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fff9f3] px-6 py-16">
      <div className="w-full max-w-[440px]">
        <Link
          href="/"
          className="mb-8 block text-center text-[20px] font-medium tracking-[-0.02em] text-[#222222]"
        >
          CodeCard
        </Link>
        <div className="rounded-[24px] border border-[rgba(34,34,34,0.08)] bg-white p-8">
          <h1 className="text-[26px] font-medium tracking-[-0.025em] text-[#222222]">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-[15px] leading-relaxed text-[#7a7876]">{subtitle}</p>
          )}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
