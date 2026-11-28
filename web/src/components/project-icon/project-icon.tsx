import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectIcon({
  iconUrl,
  className,
  size,
  fit = "cover",
}: {
  iconUrl?: string | null;
  className?: string;
  size?: number;
  /** "contain" shows the whole logo, for logos that are not square. */
  fit?: "cover" | "contain";
}) {
  return (
    <div
      className={cn(
        "flex size-12 items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground",
        className,
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt=""
          className={cn("h-full w-full", fit === "contain" ? "object-contain" : "object-cover")}
        />
      ) : (
        <Rocket className="size-5" />
      )}
    </div>
  );
}
