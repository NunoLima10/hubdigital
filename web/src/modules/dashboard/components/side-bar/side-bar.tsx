import { useRouterState } from "@tanstack/react-router";
import { type RefObject, useEffect, useRef, useState } from "react";
import { DashboardNav } from "../navbar/navbar";

type Overflow = { before: boolean; after: boolean };

const FADE = "32px";

/**
 * Which edges of a horizontal scroller have more content past them. The hidden
 * scrollbar gives no hint on a phone, so the tabs fade out where they continue.
 */
function useHorizontalOverflow(ref: RefObject<HTMLElement | null>) {
  const [overflow, setOverflow] = useState<Overflow>({ before: false, after: false });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    function measure() {
      if (!element) return;
      const maximum = element.scrollWidth - element.clientWidth;
      const next = { before: element.scrollLeft > 1, after: element.scrollLeft < maximum - 1 };
      setOverflow((current) =>
        current.before === next.before && current.after === next.after ? current : next,
      );
    }
    measure();
    element.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [ref]);
  return overflow;
}

function fadeMask({ before, after }: Overflow) {
  if (!before && !after) return undefined;
  const start = before ? `transparent, black ${FADE}` : "black";
  const end = after ? `black calc(100% - ${FADE}), transparent` : "black";
  return `linear-gradient(to right, ${start}, ${end})`;
}

export function SideBar() {
  const navigationRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  useEffect(() => {
    const container = navigationRef.current;
    const active = container?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!container || !active || window.matchMedia("(min-width: 1024px)").matches) return;
    const containerBounds = container.getBoundingClientRect();
    const activeBounds = active.getBoundingClientRect();
    if (activeBounds.left < containerBounds.left) {
      container.scrollLeft -= containerBounds.left - activeBounds.left + 4;
    } else if (activeBounds.right > containerBounds.right) {
      container.scrollLeft += activeBounds.right - containerBounds.right + 4;
    }
  }, [pathname]);

  useEffect(() => {
    const container = navigationRef.current;
    if (!container) return;
    function scrollTabs(event: WheelEvent) {
      if (!container || event.ctrlKey || event.shiftKey || event.deltaX !== 0 ||
          window.matchMedia("(min-width: 1024px)").matches) return;
      const maximum = container.scrollWidth - container.clientWidth;
      if (maximum <= 0) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? container.clientWidth : 1);
      const next = Math.max(0, Math.min(maximum, container.scrollLeft + delta));
      if (next === container.scrollLeft) return;
      event.preventDefault();
      container.scrollLeft = next;
    }
    container.addEventListener("wheel", scrollTabs, { passive: false });
    return () => container.removeEventListener("wheel", scrollTabs);
  }, []);

  const overflow = useHorizontalOverflow(navigationRef);

  return (
    <div className="min-w-0 lg:sticky lg:top-6 lg:rounded-lg lg:border lg:p-4">
      <div
        ref={navigationRef}
        style={{ maskImage: fadeMask(overflow), WebkitMaskImage: fadeMask(overflow) }}
        className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b pb-2 lg:overflow-visible lg:border-0 lg:pb-0"
      >
        <DashboardNav />
      </div>
    </div>
  );
}
