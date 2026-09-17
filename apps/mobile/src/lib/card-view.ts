import {
  buildCanonicalPublicProfileUrl,
  buildQrProfileUrl,
  getPublicProfileLinkForShare,
} from './public-codecard-url';

export type OwnerCardProfile = {
  slug: string;
  display_name: string;
  headline: string | null;
  avatar_url: string | null;
  is_public: boolean;
};

export type OwnerCardPresentation = {
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  published: boolean;
  shareUrl: string | null;
  qrUrl: string | null;
  publicUrl: string | null;
};

export function buildOwnerCardPresentation(
  profile: OwnerCardProfile,
  origin: string,
): OwnerCardPresentation {
  const shareUrl = getPublicProfileLinkForShare(profile.slug, origin);
  const canonical = buildCanonicalPublicProfileUrl(profile.slug, origin);
  const qrUrl = shareUrl ? buildQrProfileUrl(shareUrl) : null;

  return {
    displayName: profile.display_name,
    headline: profile.headline,
    avatarUrl: profile.avatar_url,
    published: profile.is_public,
    shareUrl,
    qrUrl: profile.is_public ? qrUrl : null,
    publicUrl: canonical.ok ? canonical.url : null,
  };
}
