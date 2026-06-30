import { cn } from '@/lib/cn';

interface ThemedSkeletonProps {
  className?: string;
}

export function ThemedSkeleton({ className }: ThemedSkeletonProps) {
  return <div className={cn('cc-skeleton', className)} aria-hidden />;
}
