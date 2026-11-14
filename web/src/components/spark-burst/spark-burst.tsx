import { cn } from "@/lib/utils";
import { prefersReducedMotion, replay } from "@/lib/motion";
import { useImperativeHandle, useRef, type Ref } from "react";

export type SparkBurstHandle = { burst: () => void };

type Props = {
  ref?: Ref<SparkBurstHandle>;
  /** How many sparks, spread evenly around the circle. */
  count?: number;
  /** How far the sparks fly, in px. */
  distance?: number;
  delay?: number;
  /** Positions the burst's centre and sets the colour (sparks use bg-current). */
  className?: string;
};

// A ring of dots that flies out from a point and fades. Place it inside a
// relatively positioned parent and call `burst()` through the ref.
export function SparkBurst({ ref, count = 8, distance = 26, delay = 0, className }: Props) {
  const container = useRef<HTMLSpanElement>(null);
  const angles = Array.from({ length: count }, (_, i) => (360 / count) * i);

  useImperativeHandle(ref, () => ({
    burst() {
      if (prefersReducedMotion()) return;
      container.current?.childNodes.forEach((spark, i) =>
        replay(
          spark as Element,
          [
            { transform: `translate(-50%, -50%) rotate(${angles[i]}deg) translateX(0) scale(1)`, opacity: 1 },
            { transform: `translate(-50%, -50%) rotate(${angles[i]}deg) translateX(${distance}px) scale(0.3)`, opacity: 0 },
          ],
          { duration: 500, delay, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "backwards" },
        ),
      );
    },
  }));

  return (
    <span
      ref={container}
      aria-hidden="true"
      className={cn("pointer-events-none absolute top-1/2 left-1/2", className)}
    >
      {angles.map((angle) => (
        <span key={angle} className="absolute size-1 rounded-full bg-current opacity-0" />
      ))}
    </span>
  );
}
