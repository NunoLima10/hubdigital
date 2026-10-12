import { cn } from "@/lib/utils";
import { prefersReducedMotion, replay } from "@/lib/motion";
import { useLayoutEffect, useRef } from "react";

// A number that rolls up when it grows and down when it shrinks. The first
// render never animates, so counts loaded from the server just appear.
export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const inner = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);

  useLayoutEffect(() => {
    if (value === previous.current) return;
    const direction = value > previous.current ? 1 : -1;
    previous.current = value;
    if (prefersReducedMotion()) return;
    replay(inner.current, [{ transform: `translateY(${direction * 100}%)` }, { transform: "translateY(0)" }], {
      duration: 350,
      easing: "cubic-bezier(0.3, 1.4, 0.5, 1)",
    });
  }, [value]);

  return (
    <span className={cn("inline-block overflow-hidden align-bottom", className)}>
      <span ref={inner} className="block">
        {value}
      </span>
    </span>
  );
}
