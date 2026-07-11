import { isAllowedProfileLinkHref } from '@codecard/validation';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';

export function toSafeProfileLinkItems(
  links: ProfileLinkItem[],
): ProfileLinkItem[] {
  return links.filter((link) => isAllowedProfileLinkHref(link.url));
}
