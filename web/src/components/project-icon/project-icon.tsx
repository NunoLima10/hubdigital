import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectIcon({
  iconUrl,
  className,
  size,
}: {
  iconUrl?: string | null;
  className?: string;
  size?: number;
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
        <img src={iconUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Rocket className="size-5" />
      )}
    </div>
  );
}
