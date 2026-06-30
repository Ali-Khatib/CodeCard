import { ThemedSkeleton } from '@/components/ui/themed-skeleton';
import { TYPE } from '@/lib/design/tokens';

export function ProfilePageSkeleton() {
  return (
    <div className="relative min-h-[100dvh] text-text-primary" aria-busy aria-label="Loading profile">
      <header className="cc-container flex items-center gap-5 pb-6 pt-[108px] md:gap-6 md:pt-[120px]">
        <ThemedSkeleton className="h-[72px] w-[72px] shrink-0 rounded-[16px] md:h-[80px] md:w-[80px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <ThemedSkeleton className="h-5 w-[min(280px,70%)]" />
          <ThemedSkeleton className="h-4 w-[min(200px,50%)]" />
        </div>
      </header>

      <section className="cc-container pb-16" aria-hidden>
        <div className="mx-auto w-[min(90%,1100px)]">
          <ThemedSkeleton className="aspect-[4/5] w-full rounded-xl sm:aspect-[16/10]" />
          <div className="mt-8 space-y-3">
            <ThemedSkeleton className="h-10 w-[min(420px,80%)]" />
            <ThemedSkeleton className="h-5 w-[min(520px,90%)]" />
            <div className="flex gap-2 pt-2">
              <ThemedSkeleton className="h-8 w-20 rounded-badge" />
              <ThemedSkeleton className="h-8 w-24 rounded-badge" />
              <ThemedSkeleton className="h-8 w-16 rounded-badge" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="relative min-h-[100dvh] text-text-primary" aria-busy aria-label="Loading project">
      <header className="cc-container sticky top-0 z-20 py-4">
        <ThemedSkeleton className="h-12 w-full rounded-full" />
      </header>

      <div className="relative w-full overflow-hidden">
        <ThemedSkeleton className="aspect-[16/9] min-h-[min(52vh,520px)] w-full rounded-none" />
        <div className="absolute inset-x-0 bottom-0 cc-container pb-10 pt-28 md:pb-14 md:pt-36">
          <p className={TYPE.eyebrow}>Featured project</p>
          <ThemedSkeleton className="mt-3 h-12 w-[min(360px,75%)]" />
          <ThemedSkeleton className="mt-4 h-6 w-[min(480px,85%)]" />
        </div>
      </div>

      <article className="cc-container cc-content pb-24 pt-10 md:pt-14">
        <ThemedSkeleton className="h-40 w-full rounded-card" />
        <div className="mt-12 space-y-4 border-t border-border/40 pt-12">
          <ThemedSkeleton className="h-4 w-24" />
          <ThemedSkeleton className="h-5 w-full max-w-[640px]" />
          <ThemedSkeleton className="h-5 w-full max-w-[600px]" />
          <ThemedSkeleton className="h-5 w-[min(480px,70%)]" />
        </div>
      </article>
    </div>
  );
}
