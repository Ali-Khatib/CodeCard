/**
 * WS12-T009 — Deliberate alt-text rules for user-uploaded imagery.
 * Never derive alt from storage paths or filenames.
 */

/** Avatar next to a visible name → empty alt (redundant). Otherwise name-based. */
export function avatarImageAlt(options: {
  displayName: string;
  nameAlreadyAnnounced?: boolean;
}): string {
  if (options.nameAlreadyAnnounced) return '';
  const trimmed = options.displayName.trim();
  return trimmed ? `${trimmed} avatar` : 'Profile avatar';
}

/**
 * Project cover/poster beside a visible title is decorative.
 * Standalone covers (no adjacent title) use a short informative alt.
 */
export function projectCoverAlt(options: {
  projectTitle: string;
  titleAdjacent?: boolean;
}): string {
  if (options.titleAdjacent !== false) return '';
  const title = options.projectTitle.trim() || 'Project';
  return `${title} cover image`;
}

/** Gallery / screenshot alt when the image is informative (not button-named). */
export function projectScreenshotAlt(options: {
  projectTitle: string;
  index: number;
}): string {
  const title = options.projectTitle.trim() || 'Project';
  return `${title} screenshot ${options.index + 1}`;
}

/**
 * Research figure: caption is preferred as visible figcaption with empty alt.
 * When caption is missing, use a non-filename fallback (known a11y debt).
 */
export function researchFigureImageAlt(options: {
  caption: string | null | undefined;
  captionVisibleNearby?: boolean;
}): string {
  const caption = options.caption?.trim();
  if (caption && options.captionVisibleNearby !== false) return '';
  if (caption) return caption;
  return 'Research figure';
}

export function looksLikeFilenameAlt(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /\.(png|jpe?g|gif|webp|avif|svg|heic)$/i.test(trimmed) || trimmed.includes('/');
}
