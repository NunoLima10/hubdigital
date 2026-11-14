import { prefersReducedMotion } from "@/lib/motion";
import { useCallback, useLayoutEffect, useRef } from "react";

type Handlers = {
  onActivate?: () => void;
  onDeactivate?: () => void;
};

/**
 * Plays an animation when `active` flips, but only after `arm()` was called
 * (usually from the click that caused it). State that changes on its own,
 * like a refetch right after sign-in, lands without animating.
 */
export function useToggleAnimation(active: boolean, handlers: Handlers) {
  const armed = useRef(false);
  const wasActive = useRef(active);
  const latest = useRef(handlers);
  useLayoutEffect(() => {
    latest.current = handlers;
  });

  useLayoutEffect(() => {
    if (active === wasActive.current) return;
    wasActive.current = active;
    if (!armed.current) return;
    armed.current = false;
    if (prefersReducedMotion()) return;
    if (active) latest.current.onActivate?.();
    else latest.current.onDeactivate?.();
  }, [active]);

  return useCallback(() => {
    armed.current = true;
  }, []);
}
