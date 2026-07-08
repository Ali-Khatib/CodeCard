type ProfileFields = {
  display_name?: string | null;
  headline?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  is_public?: boolean | null;
};

export function profileCompletion(
  profile: ProfileFields,
  projectCount = 0,
  linkCount = 0,
): number {
  let score = 0;
  if (profile.display_name?.trim()) score += 20;
  if (profile.headline?.trim()) score += 20;
  if (profile.avatar_url?.trim()) score += 20;
  if (profile.bio?.trim()) score += 15;
  if (profile.is_public) score += 15;
  if (projectCount > 0) score += 10;
  if (linkCount > 0) score += 5;
  return Math.min(100, score);
}

export function greetingForHour(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
