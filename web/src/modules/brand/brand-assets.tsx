import { LogoMark } from "@/components/brand-logo/brand-logo";
import { cn } from "@/lib/utils";
import lockupSource from "../../../../brand/hub-digital-cabo-verde.svg?raw";

// The official stacked lockup from brand/, recoloured to follow the text colour
// so the same file works on light, dark and cobalt backgrounds. "Cabo Verde"
// keeps its lighter weight through opacity instead of a fixed grey.
const lockupMarkup = lockupSource
  .replace(/<\?xml[^>]*>/, "")
  .replace(/<title[^>]*>.*?<\/title>/, "")
  .replace(/<desc[^>]*>.*?<\/desc>/, "")
  .replace(/role="img"\s*aria-labelledby="[^"]*"/, 'aria-hidden="true"')
  .replaceAll('fill="#000"', 'fill="currentColor"')
  .replace('fill="#85888d"', 'fill="currentColor" fill-opacity="0.55"');

export function StackedLockup({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Hub Digital — Cabo Verde"
      className={cn("block [&>svg]:size-full", className)}
      dangerouslySetInnerHTML={{ __html: lockupMarkup }}
    />
  );
}

/** Symbol + wordmark on one line, sized from the font size like the header. */
export function HorizontalLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.4em] font-semibold tracking-tight whitespace-nowrap", className)}>
      <LogoMark className="size-[1.25em]" />
      Hub Digital
    </span>
  );
}

/** The app icon from public/favicon.svg, white mark on a near-black tile. */
export function AppIcon({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span
      className={cn(
        "grid aspect-square place-items-center rounded-[22%]",
        inverted ? "bg-white text-[#0a0a0a]" : "bg-[#0a0a0a] text-white",
        className,
      )}
    >
      <LogoMark className="size-[56%] translate-x-[-2%]" />
    </span>
  );
}

const STROKES = {
  top: "M133 124 L156 133 Q159 134 159 137 L159 165 Q159 167 156 168 L133 178 Z",
  middle:
    "M226 124 L204 133 Q201 134 201 137 L201 157 Q201 160 198 162 L136 186 Q133 187 133 191 L133 236 L155 227 Q159 226 159 222 L159 202 Q159 199 162 198 L223 175 Q227 173 227 170 L227 124 Z",
  bottom: "M227 182 L204 191 Q201 192 201 196 L201 222 Q201 225 204 227 L227 237 Z",
};

/**
 * The H taken apart: the three strokes in different tones, the shared 21°
 * slant drawn as guides, and the stroke width that sets the clear space.
 */
export function MarkAnatomy() {
  return (
    <svg viewBox="100 96 160 168" className="h-auto w-full max-w-sm overflow-visible" aria-hidden="true">
      {/* Bounding box */}
      <rect x="133" y="124" width="94" height="113" fill="none" className="stroke-muted-foreground/40" strokeDasharray="3 3" strokeWidth="0.8" />
      <path d={STROKES.top} className="fill-foreground" />
      <path d={STROKES.middle} className="fill-primary" />
      <path d={STROKES.bottom} className="fill-foreground" />
      {/* The one slant: the middle stroke and the outer strokes share it */}
      <line x1="112" y1="194.5" x2="248" y2="143" className="stroke-[#ff4d3d]" strokeDasharray="4 3" strokeWidth="0.9" />
      <line x1="124" y1="120.5" x2="168" y2="137.2" className="stroke-[#ff4d3d]" strokeDasharray="4 3" strokeWidth="0.9" />
      <text x="236" y="139" className="fill-[#ff4d3d] text-[7px] font-semibold">21°</text>
      <text x="150" y="118" className="fill-[#ff4d3d] text-[7px] font-semibold">21°</text>
      {/* Stroke width X */}
      <line x1="133" y1="250" x2="159" y2="250" className="stroke-primary" strokeWidth="0.9" />
      <line x1="133" y1="246" x2="133" y2="254" className="stroke-primary" strokeWidth="0.9" />
      <line x1="159" y1="246" x2="159" y2="254" className="stroke-primary" strokeWidth="0.9" />
      <text x="146" y="261" textAnchor="middle" className="fill-primary text-[7px] font-semibold">X</text>
      <text x="230" y="244" className="fill-muted-foreground text-[6px] font-medium">94 × 113</text>
    </svg>
  );
}

/** The mark inside its clear-space zone: one stroke width (X) on every side. */
export function ClearSpace() {
  return (
    <svg viewBox="100 91 160 179" className="h-auto w-full max-w-xs" aria-hidden="true">
      <rect x="107" y="98" width="146" height="165" rx="1" fill="none" className="stroke-[#ff4d3d]" strokeDasharray="4 3" strokeWidth="1" />
      <rect x="133" y="124" width="94" height="113" className="fill-[#ff4d3d]/5" />
      {[
        [107, 98],
        [227, 237],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="26" height="26" className="fill-[#ff4d3d]/15 stroke-[#ff4d3d]" strokeWidth="0.6" />
          <text x={x + 13} y={y + 16} textAnchor="middle" className="fill-[#ff4d3d] text-[9px] font-semibold">X</text>
        </g>
      ))}
      <g className="fill-foreground">
        <path d={STROKES.top} />
        <path d={STROKES.middle} />
        <path d={STROKES.bottom} />
      </g>
    </svg>
  );
}
