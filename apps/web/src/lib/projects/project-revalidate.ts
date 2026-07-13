import { revalidatePath } from 'next/cache';

export function revalidateOwnedProjectPaths(input: {
  projectId: string;
  profileSlug?: string | null;
  isPublished?: boolean;
}) {
  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${input.projectId}/edit`);

  if (input.profileSlug && input.isPublished) {
    revalidatePath(`/${input.profileSlug}`);
    revalidatePath(`/${input.profileSlug}/projects/${input.projectId}`);
  }
}
