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

export function DashboardProfileEditorSkeleton() {
  return (
    <div className="cc-app-page cc-app-page--1120" aria-busy="true" aria-label="Loading profile editor">
      <p className="mb-6 text-[14px] font-medium text-[var(--app-smoke)]" role="status">
        Loading profile…
      </p>
      <div className="space-y-3" aria-hidden>
        <ThemedSkeleton className="h-3 w-16 rounded-full" />
        <ThemedSkeleton className="h-7 w-[min(280px,65%)] rounded-full" />
        <ThemedSkeleton className="h-4 w-[min(420px,80%)] rounded-full" />
      </div>
      <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]" aria-hidden>
        <div className="space-y-4 overflow-hidden rounded-[20px] border border-[var(--app-border)] bg-[var(--app-paper)] p-5 sm:p-6">
          <ThemedSkeleton className="h-5 w-36 rounded-full" />
          <ThemedSkeleton className="h-16 w-16 rounded-full" />
          {Array.from({ length: 5 }).map((_, index) => (
            <ThemedSkeleton key={index} className="h-11 w-full rounded-[12px]" />
          ))}
        </div>
        <div className="space-y-4">
          <ThemedSkeleton className="h-40 w-full rounded-[20px]" />
          <ThemedSkeleton className="h-32 w-full rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="cc-profile-home" aria-busy="true" aria-label="Loading dashboard">
      <p className="mb-5 text-[14px] font-medium text-[var(--app-smoke)]" role="status">
        Opening your workspace…
      </p>
      <div className="cc-profile-home__greeting" aria-hidden>
        <div className="space-y-3">
          <ThemedSkeleton className="h-3 w-14 rounded-full" />
          <ThemedSkeleton className="h-8 w-[min(320px,75%)] rounded-full" />
        </div>
        <div className="flex gap-2">
          <ThemedSkeleton className="h-9 w-28 rounded-full" />
          <ThemedSkeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
      <div className="mt-8 space-y-4" aria-hidden>
        <ThemedSkeleton className="h-28 w-full rounded-[20px]" />
        <ThemedSkeleton className="h-36 w-full rounded-[20px]" />
        <ThemedSkeleton className="h-44 w-full rounded-[20px]" />
      </div>
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
