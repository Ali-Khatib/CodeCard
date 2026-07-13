import { isAllowedProjectLinkHref } from '@codecard/validation';
import type { FeaturedProjectLink } from '@/lib/projects/featured';

export function toSafeProjectLinkItems(
  links: FeaturedProjectLink[],
): FeaturedProjectLink[] {
  return links.filter((link) => isAllowedProjectLinkHref(link.url));
}

export function firstSafeProjectLink(
  links: FeaturedProjectLink[],
  types: string[],
): FeaturedProjectLink | undefined {
  return toSafeProjectLinkItems(links).find((link) => types.includes(link.type));
}
