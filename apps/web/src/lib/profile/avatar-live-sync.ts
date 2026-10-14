export const PROFILE_AVATAR_SAVED_EVENT = 'codecard-profile-avatar-saved';

export function publishProfileAvatarSaved(avatarUrl: string) {
  if (typeof window === 'undefined' || !avatarUrl) return;
  window.dispatchEvent(
    new CustomEvent(PROFILE_AVATAR_SAVED_EVENT, { detail: { avatarUrl } }),
  );
}

export function subscribeProfileAvatarSaved(listener: (avatarUrl: string) => void) {
  const handler = (event: Event) => {
    const url = (event as CustomEvent<{ avatarUrl?: string }>).detail?.avatarUrl;
    if (typeof url === 'string' && url) listener(url);
  };
  window.addEventListener(PROFILE_AVATAR_SAVED_EVENT, handler);
  return () => window.removeEventListener(PROFILE_AVATAR_SAVED_EVENT, handler);
}
