import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

// The geometric "H" mark from brand/logo-h.svg, drawn in currentColor so it
// follows the surrounding text colour in light and dark mode.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="128 120 104 121"
      aria-hidden="true"
      className={cn("size-6 shrink-0 overflow-visible", className)}
      fill="currentColor"
    >
      <path className="hub-lift-top" d="M133 124 L156 133 Q159 134 159 137 L159 165 Q159 167 156 168 L133 178 Z" />
      <path className="hub-lift-middle" d="M226 124 L204 133 Q201 134 201 137 L201 157 Q201 160 198 162 L136 186 Q133 187 133 191 L133 236 L155 227 Q159 226 159 222 L159 202 Q159 199 162 198 L223 175 Q227 173 227 170 L227 124 Z" />
      <path className="hub-lift-bottom" d="M227 182 L204 191 Q201 192 201 196 L201 222 Q201 225 204 227 L227 237 Z" />
    </svg>
  );
}

const SPARK_ANGLES = Array.from({ length: 8 }, (_, i) => i * 45);

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("hub-lift inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="relative inline-flex">
        <LogoMark />
        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2">
          {SPARK_ANGLES.map((angle) => (
            <span
              key={angle}
              className="hub-spark absolute size-1 rounded-full bg-primary opacity-0"
              style={{ "--hub-spark-angle": `${angle}deg` } as CSSProperties}
            />
          ))}
        </span>
      </span>
      Hub Digital
    </span>
  );
}
