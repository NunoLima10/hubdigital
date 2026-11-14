import "flag-icons/css/flag-icons.min.css";
import type { Country } from "@hubdigital/shared";
import { cn } from "@/lib/utils";

// Self-hosted SVG flags: emoji flags render as two letters on Windows.
export function CountryFlag({ country, className }: { country: Country; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(`fi fi-${country}`, "shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]", className)}
    />
  );
}
