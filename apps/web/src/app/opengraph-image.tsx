import {
  PUBLIC_OG_IMAGE_ALT,
  PUBLIC_OG_IMAGE_CONTENT_TYPE,
  PUBLIC_OG_IMAGE_SIZE,
  renderGenericPublicOgImage,
} from '@/lib/profile/public-og-image-response';

export const alt = PUBLIC_OG_IMAGE_ALT;
export const size = PUBLIC_OG_IMAGE_SIZE;
export const contentType = PUBLIC_OG_IMAGE_CONTENT_TYPE;

/** Site-wide social preview fallback with no user-specific content. */
export default function RootOpengraphImage() {
  return renderGenericPublicOgImage();
}
