import { revalidatePath } from 'next/cache';

export function revalidateOwnedResearchPaths(input: {
  researchPaperId: string;
  paperSlug?: string | null;
  profileSlug?: string | null;
  isPublished?: boolean;
  touchPublicRoutes?: boolean;
}) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/research');
  revalidatePath(`/dashboard/research/${input.researchPaperId}/edit`);
  revalidatePath('/dashboard/profile/preview');

  if (input.profileSlug && (input.isPublished || input.touchPublicRoutes)) {
    revalidatePath(`/${input.profileSlug}`);
    if (input.paperSlug) {
      revalidatePath(`/${input.profileSlug}/research/${input.paperSlug}`);
    }
  }
}

export function revalidateDeletedResearchPaths(input: {
  researchPaperId: string;
  paperSlug?: string | null;
  profileSlug?: string | null;
  wasPublished?: boolean;
}) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/research');
  revalidatePath(`/dashboard/research/${input.researchPaperId}/edit`);
  revalidatePath('/dashboard/profile/preview');

  if (input.profileSlug && input.wasPublished) {
    revalidatePath(`/${input.profileSlug}`);
    if (input.paperSlug) {
      revalidatePath(`/${input.profileSlug}/research/${input.paperSlug}`);
    }
  }
}
