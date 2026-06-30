import { ThemedSkeleton } from '@/components/ui/themed-skeleton';

export default function MarketingLoading() {
  return (
    <div className="cc-container pb-16 pt-[120px]" aria-busy aria-label="Loading page">
      <ThemedSkeleton className="h-14 w-[min(520px,90%)]" />
      <ThemedSkeleton className="mt-6 h-6 w-[min(640px,95%)]" />
      <ThemedSkeleton className="mt-4 h-6 w-[min(480px,80%)]" />
      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <ThemedSkeleton className="h-56 rounded-card" />
        <ThemedSkeleton className="h-56 rounded-card" />
      </div>
    </div>
  );
}
