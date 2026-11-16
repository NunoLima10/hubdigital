import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** When the piece hits the corner, from mount, in milliseconds. */
export const DOCK_IMPACT_MS = 2150;

const COLORS = ["#2563eb", "#4d7fff", "#f6c445", "#e23d3d", "#ffffff"];

/**
 * The "Encaixe" reveal: an earned piece (a person's medal, a project's
 * plaque) shows up first, large and spinning where the subject will be; the
 * subject (an avatar, a project logo, 96px) then appears and the piece flies
 * into its corner and lands with a bump. Clicking plays it again. The
 * keyframes live in index.css (badge-dock-*).
 */
export function DockReveal({
  piece,
  tint,
  label = "Celebrar outra vez",
  confettiZIndex = 100,
  pieceClassName,
  children,
}: {
  /** What flies into the corner, drawn at the 40px it lands at. */
  piece: ReactNode;
  /** The piece's colour, for the shockwave. */
  tint: string;
  label?: string;
  /** Raise above an overlay the reveal sits in. */
  confettiZIndex?: number;
  pieceClassName?: string;
  /** The subject itself, already sized at 96px. */
  children: ReactNode;
}) {
  const [run, setRun] = useState(0);
  const pieceRef = useRef<HTMLSpanElement>(null);

  // Confetti bursts out of the corner the piece lands on.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = window.setTimeout(() => {
      const rect = pieceRef.current?.getBoundingClientRect();
      if (!rect) return;
      confetti({
        particleCount: 110,
        spread: 360,
        startVelocity: 26,
        gravity: 0.8,
        scalar: 0.9,
        zIndex: confettiZIndex,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: COLORS,
      });
    }, DOCK_IMPACT_MS);
    return () => window.clearTimeout(timer);
  }, [run, confettiZIndex]);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setRun((value) => value + 1)}
      className="relative mx-auto block rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      style={{ "--badge-tint": tint } as CSSProperties}
    >
      <span key={run} className="badge-dock relative block">
        <span className="badge-dock__avatar block">{children}</span>
        <span aria-hidden="true" className="badge-dock__ring" />
        <span ref={pieceRef} className={cn("badge-dock__medal", pieceClassName)}>
          {piece}
        </span>
      </span>
    </button>
  );
}
