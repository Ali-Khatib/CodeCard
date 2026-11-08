'use client';

import Image from 'next/image';

/**
 * An art-directed photography slot.
 *
 * Photography is the primary design element of this site, so each slot is a
 * real commitment: a fixed aspect ratio, a focal point, a desktop and mobile
 * crop, and a written art direction. Until a file lands the slot renders an
 * honest direction card at exactly the dimensions the photograph will take,
 * so the layout, the scroll choreography and the crops are all final before
 * the shoot. Nothing here pretends to be a photograph.
 *
 * Drop a file at `public/images/<src>` and the slot becomes the real image
 * with no other change.
 */

export type PhotoSlot = {
  /** Stable id, also the manifest key. */
  id: string;
  /** Path under public/images, e.g. "hero/engineer-studio.jpg". */
  src?: string;
  /** Written for a photo editor, and used as the alt text. */
  alt: string;
  /** What the shot must contain and feel like. */
  direction: string;
  /** CSS aspect-ratio for the slot, e.g. "16 / 9". */
  ratio: string;
  /** object-position on desktop and on phones, in that order. */
  focal?: string;
  focalMobile?: string;
};

export function EditorialImage({
  slot,
  className = '',
  sizes = '100vw',
  priority = false,
  cover = true,
}: {
  slot: PhotoSlot;
  className?: string;
  sizes?: string;
  priority?: boolean;
  cover?: boolean;
}) {
  const style = {
    aspectRatio: slot.ratio,
    '--focal': slot.focal ?? '50% 50%',
    '--focal-m': slot.focalMobile ?? slot.focal ?? '50% 50%',
  } as React.CSSProperties;

  if (!slot.src) {
    return (
      <div className={`ls-photo ls-photo--pending ${className}`.trim()} style={style}>
        <div className="ls-photo__card">
          <p className="ls-photo__id">{slot.id}</p>
          <p className="ls-photo__dir">{slot.direction}</p>
          <p className="ls-photo__meta">
            <span>{slot.ratio.replace(/\s/g, '')}</span>
            <span>{slot.focal ?? '50% 50%'}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ls-photo ${className}`.trim()} style={style}>
      <Image
        src={`/images/${slot.src}`}
        alt={slot.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cover ? 'ls-photo__img' : 'ls-photo__img ls-photo__img--contain'}
      />
    </div>
  );
}
