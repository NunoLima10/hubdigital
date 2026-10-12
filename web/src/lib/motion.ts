// Small helpers for the Web Animations API micro-interactions (vote, favorite,
// publish). Animations are played imperatively so a new click can cancel the
// one still running instead of fighting it.

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Restarts an element's animation from scratch. */
export function replay(
  element: Element | null | undefined,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
) {
  if (!element) return;
  for (const animation of element.getAnimations()) animation.cancel();
  element.animate(keyframes, options);
}

/** Squeeze-and-pop used when something is switched on. */
export const POP_KEYFRAMES: Keyframe[] = [
  { transform: "scale(1)" },
  { transform: "scale(0.7)", offset: 0.25 },
  { transform: "scale(1.25)", offset: 0.6 },
  { transform: "scale(1)" },
];

/** Quick press used when something is switched off. */
export const PRESS_KEYFRAMES: Keyframe[] = [
  { transform: "scale(0.85)" },
  { transform: "scale(1)" },
];
