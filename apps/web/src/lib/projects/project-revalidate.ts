import { revalidatePath } from 'next/cache';

export function revalidateOwnedProjectPaths(input: {
  projectId: string;
  profileSlug?: string | null;
  isPublished?: boolean;
  touchPublicRoutes?: boolean;
}) {
  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${input.projectId}/edit`);

  if (input.profileSlug && (input.isPublished || input.touchPublicRoutes)) {
    revalidatePath(`/${input.profileSlug}`);
    revalidatePath(`/${input.profileSlug}/projects/${input.projectId}`);
  }
}

export function revalidateDeletedProjectPaths(input: {
  projectId: string;
  profileSlug?: string | null;
  wasPublished?: boolean;
}) {
  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${input.projectId}/edit`);

  if (input.profileSlug && input.wasPublished) {
    revalidatePath(`/${input.profileSlug}`);
    revalidatePath(`/${input.profileSlug}/projects/${input.projectId}`);
  }
}
