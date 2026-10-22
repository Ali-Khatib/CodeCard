import { revalidatePath } from 'next/cache';
import { revalidatePublicProfileSlugChange } from '@/lib/profile/public-cache';

/**
 * Mark dashboard and public profile caches stale after a real profile write.
 * Invalidation is recorded here. The caller does not render those routes.
 */
export function revalidateOwnedProfileCaches(input: {
  previousSlug?: string;
  nextSlug?: string;
}) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard/profile/preview');
  revalidatePublicProfileSlugChange({
    previousSlug: input.previousSlug,
    nextSlug: input.nextSlug,
  });
}
