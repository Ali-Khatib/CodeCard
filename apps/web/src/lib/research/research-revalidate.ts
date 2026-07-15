import { revalidatePath } from 'next/cache';
import {
  revalidatePublicProfile,
  revalidatePublicResearch,
  revalidatePublicResearchSlugChange,
} from '@/lib/profile/public-cache';

export function revalidateOwnedResearchPaths(input: {
  researchPaperId: string;
  paperSlug?: string | null;
  previousPaperSlug?: string | null;
  profileSlug?: string | null;
  isPublished?: boolean;
  touchPublicRoutes?: boolean;
}) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/research');
  revalidatePath(`/dashboard/research/${input.researchPaperId}/edit`);
  revalidatePath('/dashboard/profile/preview');

  if (input.profileSlug && (input.isPublished || input.touchPublicRoutes)) {
    if (
      input.previousPaperSlug &&
      input.paperSlug &&
      input.previousPaperSlug !== input.paperSlug
    ) {
      revalidatePublicResearchSlugChange({
        profileSlug: input.profileSlug,
        previousSlug: input.previousPaperSlug,
        nextSlug: input.paperSlug,
      });
    } else if (input.paperSlug) {
      revalidatePublicResearch(input.profileSlug, input.paperSlug);
    } else {
      revalidatePublicProfile(input.profileSlug);
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
    if (input.paperSlug) {
      revalidatePublicResearch(input.profileSlug, input.paperSlug);
    } else {
      revalidatePublicProfile(input.profileSlug);
    }
  }
}

export function revalidateResearchOrderPaths(input: { profileSlug?: string | null }) {
  revalidatePath('/dashboard/research');
  revalidatePath('/dashboard/profile/preview');
  if (input.profileSlug) {
    revalidatePublicProfile(input.profileSlug);
  }
}
