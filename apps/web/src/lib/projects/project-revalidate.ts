import { revalidatePath } from 'next/cache';
import {
  revalidatePublicProject,
  revalidatePublicProjectNavigation as revalidatePublicProjectNavigationCache,
  revalidatePublicProfile,
} from '@/lib/profile/public-cache';

export function revalidateOwnedProjectPaths(input: {
  projectId: string;
  profileSlug?: string | null;
  isPublished?: boolean;
  touchPublicRoutes?: boolean;
}) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${input.projectId}/edit`);
  revalidatePath('/dashboard/profile/preview');

  if (input.profileSlug && (input.isPublished || input.touchPublicRoutes)) {
    revalidatePublicProject(input.profileSlug, input.projectId);
  }
}

export function revalidatePublicProjectNavigation(input: {
  profileSlug: string;
  projectIds: string[];
}) {
  revalidatePublicProjectNavigationCache(input);
}

export function revalidateDeletedProjectPaths(input: {
  projectId: string;
  profileSlug?: string | null;
  wasPublished?: boolean;
}) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${input.projectId}/edit`);
  revalidatePath('/dashboard/profile/preview');

  if (input.profileSlug && input.wasPublished) {
    revalidatePublicProject(input.profileSlug, input.projectId);
  }
}

/** Always refresh public profile lists after create when a slug is known. */
export function revalidateCreatedProjectPaths(input: {
  projectId: string;
  profileSlug?: string | null;
  isPublished?: boolean;
}) {
  revalidatePath('/dashboard/projects');
  if (input.profileSlug && input.isPublished) {
    revalidatePublicProject(input.profileSlug, input.projectId);
  } else if (input.profileSlug) {
    // Draft create still refreshes dashboard; public list unchanged.
    revalidatePath('/dashboard/profile/preview');
  }
}

export { revalidatePublicProfile, revalidatePublicProject };
