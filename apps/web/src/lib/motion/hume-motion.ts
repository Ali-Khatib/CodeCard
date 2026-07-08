/** Hume-inspired motion tokens — restraint over decoration */
export const HUME_EASE = [0.16, 1, 0.3, 1] as const;

export const HUME_MOTION = {
  hover: 0.16,
  press: 0.09,
  cardReveal: 0.42,
  sectionReveal: 0.52,
  pageTransition: 0.22,
  stagger: 0.04,
  pillStagger: 0.04,
} as const;

export const HUME_SPRING = {
  stiffness: 120,
  damping: 20,
} as const;
