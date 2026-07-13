export type AdjacentProjects<T> = {
  previous: T | null;
  next: T | null;
};

/**
 * Returns non-wrapping previous/next neighbors within an ordered project list.
 * The caller must supply the canonical public sequence (published, profile-scoped, ordered).
 */
export function getAdjacentProjects<T extends { id: string }>(
  projects: readonly T[],
  currentProjectId: string,
): AdjacentProjects<T> {
  if (projects.length <= 1) {
    return { previous: null, next: null };
  }

  const currentIndex = projects.findIndex((project) => project.id === currentProjectId);
  if (currentIndex < 0) {
    return { previous: null, next: null };
  }

  return {
    previous: currentIndex > 0 ? projects[currentIndex - 1]! : null,
    next: currentIndex < projects.length - 1 ? projects[currentIndex + 1]! : null,
  };
}

export function buildPublicProjectDetailHref(profileSlug: string, projectId: string): string {
  const base = profileSlug === 'demo' ? '/demo' : `/${encodeURIComponent(profileSlug)}`;
  return `${base}/projects/${encodeURIComponent(projectId)}`;
}
