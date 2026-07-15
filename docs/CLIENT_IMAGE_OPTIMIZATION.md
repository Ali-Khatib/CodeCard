# Client-side image optimization (WS04-T012)

Performance-only helper for CodeCard raster uploads. **Not a security control.** Server MIME, extension, size, ownership, path, and RLS checks remain authoritative.

## Scope

Applies to:

- Profile avatars (including replacement)
- Project covers (including replacement)
- Project screenshots

Does **not** process: PDF, SVG, video, archives, AVIF, HEIC, or other non-allowlisted types.

## Configuration

Centralized in `@codecard/config` as `IMAGE_UPLOAD_OPTIMIZATION`:

| Setting | Value |
|---------|-------|
| Max width | 2000px |
| Max height | 2000px |
| JPEG quality | 0.9 |
| WebP quality | 0.9 |
| MIME types | `image/jpeg`, `image/png`, `image/webp` |

## Behavior

1. Quick client validation (existing rules)
2. Decode dimensions (`createImageBitmap` with `imageOrientation: 'from-image'` when available; otherwise `HTMLImageElement`)
3. If either dimension exceeds the cap, resize with aspect ratio preserved (never upscale, never crop)
4. Re-encode in the **same** MIME type (PNG keeps alpha; JPEG gets a white matte)
5. Prefer the original file when output is not smaller, encode fails, or decode fails
6. Request signed upload authorization using the **chosen** file’s filename, MIME, and byte size
7. Upload and finalize that file; transfer progress reflects its size
8. Temporary object URLs from decode are revoked; bitmaps are closed when supported

Sequence label for UI: indeterminate **Optimizing image…** (no fake percentage).

## Orientation

Browsers that honor `createImageBitmap(..., { imageOrientation: 'from-image' })` or EXIF-aware `HTMLImageElement` decode should show upright camera photos. Complete EXIF support is **not** claimed for every engine; there is no manual EXIF parser and no EXIF dependency.

## Metadata / privacy

Canvas re-encode typically strips most EXIF (including location). This is incidental, not a guaranteed sterilizer across every browser/format.

## Mobile

Optimizations are serialized through a single in-tab queue so multiple large screenshots are not decoded concurrently.

## Implementation

- `apps/web/src/lib/storage/optimize-image.ts`
- Wired from `executeAvatarUploadFlow` and `executeProjectMediaUploadFlow` before authorization
